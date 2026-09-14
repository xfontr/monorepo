---
issue: 101
status: wont-implement
decision: accepted
---

# 🧭 Token delegation: nothing in this repo is big enough for the hook to fire

## Context

Spotify's `shunt` plugin cuts Claude Code token usage by routing routine I/O away from the expensive
model: a `PreToolUse` hook (`check-file-size`) hard-blocks any full-file `Read` over `SHUNT_MIN_LINES`
— default 350 — and redirects it to a worker model, and a second "code-writer" mode does the same for
generating files from a spec plus reference files. Delegation runs through Spotify's internal Portal
platform (`portal-cli`, one `aika:invoke-chat` per call), which isn't available externally, so only
the pattern is reusable: a `PreToolUse` hook, a wrapper script against a cheap model, and a skill
telling Claude when to use it.

The question was whether that's worth building here, and it was explicitly gated on measuring first —
how much of actual usage in this repo is bulk reads and boilerplate versus novel reasoning.

## Result

**The hook has one possible target in the whole repo, and it is `pnpm-lock.yaml`.** The threshold is
350 lines; the largest source file here is 332. The size distribution isn't close:

| Source files | Total lines | Median | p90 | p99 | Max |
| --- | --- | --- | --- | --- | --- |
| 357 | 21,723 | 41 | 145 | 244 | 332 |

Counts exclude the lockfile and binary assets. The lockfile is the single exception at 21,160 lines,
and it is the exception that makes the point: in 114 sessions it was read **once**, as a ten-line
ranged window rather than a full-file read, which is not what the hook blocks. A lockfile is a `grep`
target, not something a worker model is asked to summarise — so the repo's only tracked match above
the threshold is a file where delegation has nothing to delegate.

**Generated output is where the genuinely large files live, and it is never read.** Build artifacts
dwarf anything tracked — `apps/huella-legal/.output/server/chunks/virtual/entry.mjs` is 51,955 lines,
`.nx/workspace-data/project-graph.json` 47,595 — so the hazard the hook guards against is real in
principle. It has not once materialised: across all 1,007 `Read` calls, **zero** touched `.nuxt/`,
`.output/`, `.nx/` or a coverage report, and the eight that reached into `node_modules` were all
type-definition lookups well under the threshold. The structural reason is that every one of those
paths is `.gitignore`d build output with nothing in it worth opening.

Measured usage agrees. Across every Claude Code session run against this repo between 2026-08-31 and
2026-09-14 — 114 sessions, 556 human turns, 9,280 assistant messages — there were **1,006 `Read`
calls, and exactly 2 returned more than 350 lines**:

| Lines | What it was |
| --- | --- |
| 872 | a `pnpm audit` dump written to a scratchpad earlier in the same session |
| 437 | Claude Code's own tool-results spill file |

Neither is repo source, and neither is a case delegation helps: both were the agent pulling one
specific fact out of a generated dump, which is precisely what a worker-model summary loses. The
premise `shunt` is built on — large source files crowding out context — has **zero instances here**.

**The cost ceiling confirms it rather than carrying the argument.** Priced at list API rates, the two
weeks of sessions come to ~$600 ($5.26/session). That is a shadow price, not a bill: this is
subscription usage, so the real currency is rate-limit headroom, and the ratios are what matter.

| Scenario | Cost | Share of spend |
| --- | --- | --- |
| If **all** `Read` content were free | $24.35 | 4.1% |
| `shunt`'s actual reach (>350-line reads) | $1.23 | 0.2% |

Both are upper bounds — the model bills each read's tokens against every later assistant message in
its session (an 88× amplification) and ignores compaction, which clears them. Tool-payload token
counts are estimated at four characters per token; the per-message figures come from the recorded
`usage` and are exact. Subagent turns are not written to the session transcripts at all, so every
total here covers main-thread work only — which understates spend and therefore overstates the share
these reads represent. The plugin's headline 90% is *mean savings on the bulk reads themselves*, not
on a bill; 90% of a 4.1% ceiling is 3.7%, and 90% of what the hook actually catches here is about a
fifth of one percent.

**Lowering the threshold doesn't rescue it.** At 200 lines the hook catches 45 reads (16.6% of all
lines read) — worth $4.68, or 0.78%. To fire often in this repo a threshold would have to sit below
the size of an ordinary file here (median 41, p90 145), at which point the pattern inverts from
"delegate the bulk work" into "delegate everything".

**The code-writer mode is smaller still.** All 358 `Write` calls together produced 266,087 tokens of
file content — 2.77% of output tokens, $5.57. Regenerating every one of them on `claude-haiku-4-5`
costs $1.33, so the gross saving is $4.23, under 0.7% of spend — before subtracting the input tokens
spent giving a worker model, on a cold cache, enough spec and reference material to match house
conventions. At a median 2,028 characters per write, these are small files, not boilerplate slabs;
the delegation round-trip plausibly costs more than it saves.

**Reproducing the pattern needs no Portal, no wrapper and no second key — and that is what sinks it.**
Claude Code delegates to a cheaper model natively: an agent definition carrying `model: haiku`, or a
`model` override on the call. This repo already does it —
[`repo-review-card.md`](../../.claude/agents/repo-review-card.md) pins `model: sonnet` — and
delegation happened 89 times in the measured fortnight. So the cost of the
mechanism is near zero, and the question collapses to whether delegating a single read can pay for
the context a delegate has to stand up first.

It can't. A session here needs a median of **38,038 tokens** of system prompt, tool definitions and
`CLAUDE.md` before its first reply; a subagent's is narrower but the same order of magnitude. A
350-line read is roughly 4,000 tokens and the largest read in the corpus was ~9,000. **Delegating one
read spends tens of thousands of tokens to avoid carrying a few thousand**, and returns a summary
instead of the file — so it loses fidelity and money at once. Haiku's lower rate doesn't close a gap
of that shape.

That also explains where delegation *does* pay, and why no plugin is needed to get it: collapsing
*many* reads into one conclusion amortises the standup across all of them. That is exactly what the
89 existing `Agent` calls do — 27 `Explore`, 23 `repo-review-card`, 21 `general-purpose`. `shunt`
hooks the per-read granularity, which is the one granularity that cannot pay for itself.

**As cheap insurance against the generated-file case, it fails on its own terms.** Three things have
to hold for "install it just in case" to pay, and none do. The harness already caps the accident:
Claude Code's `Read` returns at most 2,000 lines by default, so opening `entry.mjs` costs one
truncated page rather than 52,000 lines, and oversized tool results are spilled to a file instead of
into context — the 437-line read in the table above *is* that spill mechanism, caught in the act. The
hook also covers the wrong channel: it gates `Read` only, while `Bash` is the larger payload source
here, so a `cat`, a `grep -r` or a captured build log walks straight past it. And the premium is paid
continuously — a hook, a skill, and a hard block sitting in the read path where a misfire costs a
turn — against a payout measured in cents.

Insurance proportionate to the risk already exists and costs nothing: `.claude/settings.json` denies
`Read(**/.env)` today, and the same `deny` list takes `Read(**/.nuxt/**)`, `Read(**/.output/**)`,
`Read(.nx/**)` and `Read(**/coverage/**)` with no second model, no key and no maintenance.

Three things the measurement did surface, none of which `shunt` addresses:

- **The static preamble costs nine times what all `Read` content does.** System prompt, tool
  definitions, MCP surface and `CLAUDE.md` come to a median 38,038 tokens before the first reply, and
  every later message re-reads them — 36.5% of all cached input across the corpus, ~$120 of the ~$600.
  It grew from ~34k to ~45k over the fortnight, tracking Claude Code releases. Only ~3,600 tokens of
  it are this repo's (`CLAUDE.md` 2,683, the skill listing 896, agents 55), so most is not ours to
  cut — but [`.mcp.json`](../../.mcp.json) passes `--minimal=false` to the nx MCP server, un-hiding
  six workspace-analysis tools that were called **zero** times in 114 sessions. `--minimal` defaults
  to `true` and keeps `nx_docs`, the only nx tool actually used (3 calls).

- **`Bash` returns more into context than `Read` does** — 46.8% of tool-result payload against 43.4%.
  If context cost is ever worth chasing here, file reads are not where it lives. Unquantified: the
  amplification and size distribution of those calls weren't measured.
- **111 reads (11%) re-read a path already read in that same session**, content that was still in
  context. That is real waste, but it's a prompting problem, not a routing one — a second model would
  be paid to re-fetch what the first model already had.

## Options considered

| Option | Why not |
| --- | --- |
| Port `shunt` as-is (350-line threshold) | No source file reaches the threshold, and the files that do — the lockfile, build output — are never full-read; it fires twice in 114 sessions, both times on generated dumps outside the repo |
| Port it with a lowered threshold | 200 lines reaches 0.78% of spend; a threshold that fires often would sit below the median file size and delegate ordinary reads |
| Adopt only the code-writer mode | ≤0.7% of spend gross, before the worker's cold-cache input cost; median write is 2 KB, not boilerplate |
| Skip Portal; delegate to a `model: haiku` subagent instead | The mechanism is free and already in use here, but a delegate stands up ~38k tokens of context to avoid carrying a ~4k read — per-read delegation cannot pay for itself at any worker price |
| Build it anyway, ahead of growth | The trigger is a file size this repo's own structure works against; packages export small focused source files, so nothing is trending toward 350 lines |
| Install it as insurance against a stray read of build output | The one case it would catch is already capped by `Read`'s 2,000-line default and the spill-to-file mechanism, and it gates `Read` while `Bash` is the larger payload channel — a `cat` of `entry.mjs` bypasses it entirely |
| Deny reads of generated paths instead | **Not rejected** — this is the proportionate form of the same insurance, and `.claude/settings.json` already denies `Read(**/.env)` by the same mechanism |

## Consequences

No `PreToolUse` hook and no delegation skill. The two `PostToolUse` hooks in
[`.claude/settings.json`](../../.claude/settings.json) stay the only hooks in the repo. Cheap-model
delegation stays where it already works: agent definitions under [`.claude/agents/`](../../.claude/agents/),
chosen per task, at the granularity that amortises the standup cost.

The one piece worth taking is not the plugin: adding `Read(**/.nuxt/**)`, `Read(**/.output/**)`,
`Read(.nx/**)` and `Read(**/coverage/**)` to the existing `deny` list closes the generated-output
case outright, for the cost of four lines and no new dependency. That is a separate change and is not
made by this report.

What forecloses it is a property of the repo, not of the plugin, so the condition to revisit is
specific: **a project here starts carrying source files in the 400+ line range** — a checked-in
generated client, a vendored schema, a large fixture — or bulk reads of files outside the repo become
routine rather than incidental. Re-running the measurement is the check, but not from the session
transcripts under `~/.claude/projects/`: that format is internal to Claude Code and changes between
releases, so the scripts behind these numbers are a one-off, not a tool to keep. `/context` reports
the live breakdown, and a `statusLine` script receives `context_window` token counts on stdin.

If context cost does become a pain point before either happens, the measurement gives the order to
work in: the static preamble first (nine times the size of the prize `shunt` chases, and the
`--minimal=false` flag is a one-word fix), then `Bash` output volume, then within-session re-reads.
All three are cheaper to address than a two-model router, and none needs a hook.

## Confirmation

`.claude/settings.json` carries no `PreToolUse` hook — only the two `PostToolUse` ones this report
already counts. No `.claude/skills/` folder for delegation exists either. Both are the negative
claim this record makes, so their absence is what verifies it.
