# 🧭 Comment discipline: one fact per comment, enforced by a skill and not a hook

Spike: #82
Status: To implement

## Context

Issue #82 is titled "Improve Claude comments" with no body beyond "As title says" — the framing
came from a separately drafted proposal, not the issue thread. That proposal asks for three
artifacts: a `## Comments` section appended to CLAUDE.md, a new `.claude/skills/comment-cleanup/`
skill, and a `PostToolUse` hook on every `Edit|Write|MultiEdit` that sends newly added comment lines
to an LLM judge and blocks when it finds narration.

Two questions sit inside that, and the first pass of this report only answered one of them. The
*delivery* question — is one more paragraph, one more skill and one more always-on hook how this
repo enforces things — is answered below and unchanged. The *policy* question — what the rule should
actually say — went untested against the code it governs. Measuring the repo afterwards showed the
rule as drafted does not describe a comment anyone would want, and that this repo's own comments are
the evidence.

## Result

**The prior rule was "a comment must justify its line." That produces justification, and
justification is prose.** The rule is: *a comment carries one fact that isn't in the code, in one
sentence.* Everything below is why.

**1. The density is real, and it is localised.** 14,193 words of comment prose against 10,733 lines
of code — roughly a novella of English inside a small monorepo. It is not spread evenly:

| Project | Comment lines / code lines | Ratio |
| --- | --- | --- |
| `packages/configs`, `packages/observability`, `infrastructure/translations` | 1–2 / 150–300 | 0.6% |
| `apps/huella-legal` | 38 / 875 | 4.3% |
| `packages/i18n` | 41 / 890 | 4.6% |
| `packages/content` | 129 / 2077 | 6.2% |
| `apps/tech-docs` | 369 / 3790 | 9.7% |
| `infrastructure/scripts` | 599 / 2421 | **24.7%** |

One comment line per four lines of code in `scripts`, forty times the ratio of `content`, under the
same rules in the same repo. Density tracks recency of agent authorship rather than complexity of
the code, which is what makes it a writing habit and not a property of the problem. `content` and
`huella-legal` at 4–6% are the house range; they were written under the same one-line policy and
did not drift.

**2. The failure is length, not count.** Of the block comments in the workspace, 82 are one line,
111 are four to six, and 22 run seven to nineteen. The one-liners are almost all good —
`/** Most recent review first. */`, `/** Words Title Case would ruin: nobody calls the component
library "Ui". */` — and the long ones fail in three named ways, none of which the drafted policy
catches:

| Mode | What it looks like | Example |
| --- | --- | --- |
| Essay voice | Persuades an imagined critic instead of informing a reader: "which is how a page stops meaning anything" | [`dev/domain/projects.ts`](../../infrastructure/scripts/src/dev/domain/projects.ts) — 33 comment lines over ~45 lines of code, majority prose |
| Restating the code | A 3-line block over `[name, name.replace(SCOPE, ""), label]` | `spellings` and `matches`, same file |
| Third copy | An architecture statement already in a README and a spike | [`shared/types.ts`](../../apps/tech-docs/shared/types.ts) header vs. [`tech-docs/README.md`](../../apps/tech-docs/README.md) lines 95–99, near-verbatim |

**3. A comment that points at another comment rots fastest, and one already has.**
[`shared/adapters/exec.ts`](../../infrastructure/scripts/src/shared/adapters/exec.ts) reads "every
caller here already reads a failure back off the caught error (`gh.ts`'s comments say so
explicitly)". Three files are named `gh.ts`, and the `shared/` one carries no such comment. Pointer
rot is not a hypothetical this policy is guarding against; it happened inside the branch that exists
to fix comments.

**4. The keep-test that survives both readers is "can this be reconstructed from present state?"**
A comment explaining what the code does is worthless to a human who can read it and to a model that
reads it faster. What neither can reconstruct is *history and outside constraint*: what a scanner
flagged, the bug behind a strange sort order, a trap in a type. That test keeps roughly 15–20
comments in this workspace. Everything else is either derivable from the code or already written
down in a README, a `CLAUDE.md` or a report under `docs/spikes/` — which the next reader, human or
agent, reaches anyway.

**5. The three proposed artifacts, unchanged from the first pass.** The CLAUDE.md section holds,
folded under an emoji heading per `house-docs` and replacing the `## ✍️ Style` bullet rather than
sitting beside it. The `comment-cleanup` skill holds: its comment-only, byte-identical-code
guarantee is the thing neither `simplify` nor `code-review --fix` offers, and it gets a row in the
`## 🛠️ Skills` table. The `PostToolUse` hook does not: `type: "prompt"` hooks return
`{"ok", "reason"}`, so the drafted `{"decision": "block"}` is a field the handler never reads and
the hook would cost a model call and flag nothing. Past the schema bug, `PostToolUse` fires after
the edit lands and so cannot block it, and it would be the first LLM-judged link in a hook chain
that is otherwise deterministic shell.

## Options considered

| Option | Why not |
| --- | --- |
| Keep "a comment must justify its line" | It is satisfiable by writing a better argument, so it selects for paragraphs — `infrastructure/scripts` at 24.7% is what the rule produces when followed carefully |
| Enforce the 4–6% ratio in `check-invariants.sh` | The ratio is a symptom, and a legitimately dense file (a regex, a protocol adapter) would fail while a file of 40 tidy one-line narrations would pass. Measure it to calibrate a human judgment, don't gate on it |
| An ESLint rule capping comment-block length | Closer to enforceable than ratio, but a five-line block split into five adjacent one-line comments passes it unchanged — it moves the noise rather than removing it |
| A custom ESLint rule for comment quality | "Why vs. what" is a judgment no static rule makes; other unenforceable CLAUDE.md prose (the git rules, the dependency check-in) is left as prose too |
| Hook exactly as drafted | Returns `decision: block`, a field `type: "prompt"` hooks don't read — it would never fire |
| Hook with the field fixed to `ok`/`reason` | Still can't block on `PostToolUse` (the edit already landed) and, without `continueOnBlock: true`, ends the turn on a warning instead of routing the reason back |
| `simplify` / `code-review --fix` instead of a new skill | Both mix code and comment edits; the value here is the comment-only, byte-identical-diff guarantee |

## Consequences

Unlocks a comment pass with a calibration anchor rather than only a principle: 4–6% is what this
repo looks like when the rule is followed, and a file far outside it is worth opening. Calls for a
sweep of the two projects that drifted — `infrastructure/scripts` from ~600 comment lines to ~120
and `apps/tech-docs` from ~370, almost all of it shortening rather than deleting, since most of
these comments have one good sentence inside a paragraph. That sweep is the work this report is
waiting on, which is why the status line reads `To implement` while the policy and the skill
themselves are already in the repo.

Forecloses, for now, a real-time gate on every edit: the hook doesn't ship until it is rewritten
against the `ok`/`reason` contract, `continueOnBlock: true` is set, and its false-positive rate is
known. Revisit once the sweep shows whether an on-demand skill catches drift early enough on its
own — the 24.7% figure is the baseline any future gate gets judged against.
