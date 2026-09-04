# 🧭 Layered detection for docs drift

Spike: #40

## Context

Duplicated content across the repo already drifts — the `boundaries.ts` ↔ README architecture
table pair and the `docs/reviews` history table are both known cases, and CLAUDE.md calls the
first one out by name as "the standing failure mode in this repo." The only mechanism catching it
today is [`check-invariants.sh`](../../.claude/hooks/check-invariants.sh), a `PostToolUse` hook
that fires only when Claude Code itself edits one of a few hardcoded known-pairs, one file at a
time. Nothing runs in CI or the pre-push hook, nothing checks relative links between docs, and
nothing catches a human PR, a multi-file edit, or a kind of drift the hook doesn't already know
about.

## Result

No single mechanism covers every class of drift, so three layered checks are adopted, each scoped
to the failure mode only it catches:

1. **Generate, don't duplicate, where the source is code.** The README's `Who has it` column
   can't come from [`boundaries.ts`](../../packages/configs/src/eslint/lib/boundaries.ts) alone —
   it also depends on every package's `nx.tags` — but both together are enough to render the whole
   architecture table. A script does that and CI fails if the checked-in README differs from the
   render. This retires the exact case CLAUDE.md names, structurally rather than by reminder.
2. **A repo-wide `docs:check` step in CI and the pre-push hook.** `check-invariants.sh`'s
   remaining rules (a new `docs/reviews/*.md` has its history row, a new project has its tag
   entries in all three places) aren't renderable from a single source, so they stay
   assertion-based — but the assertion has to run over the whole tree, not the one file an agent
   happens to be editing, so it also catches human PRs and GitHub-web edits.
3. **A markdown link checker in CI.** Orthogonal to both of the above: a renamed or deleted file
   orphans a relative link without duplicating or contradicting anything, so neither generation nor
   an invariant assertion would ever see it.

Scheduled `repo-review` runs are deferred out of this decision (see Consequences) rather than
adopted as a fourth layer now.

## Options considered

| Option | Why not (as the *only* mechanism) |
| --- | --- |
| Keep `check-invariants.sh` as-is | Fires only inside a Claude Code session editing one file; a human PR, a GitHub-web edit, or a multi-file agent pass never trips it |
| Generate everything from source | Only works where a single source of truth exists in code — prose (the reasoning in a README, this record's own Context) has no source to generate from |
| Link checker only | Catches dead links, not two live sections that still resolve but now say different things |
| Scheduled `repo-review` only | Catches prose-level semantic drift a diff can't see, but a monthly cadence is too coarse to stop structural duplication from landing in the first place — it's a complement to the other layers, not a replacement |

## Consequences

Unlocks a CI gate that catches drift regardless of edit path, plus a generation step that removes
the specific pair CLAUDE.md flags as the repo's standing failure mode. Forecloses nothing — all
three layers are additive to what exists.

Scheduled `repo-review` stays deferred: it needs a run environment outside GitHub Actions (there is
no Claude/agent execution in `.github/workflows/` today), and the three layers above already cover
every drift case found during this spike. Revisit it if a future review's Docs card catches a
contradiction none of the three layers would have — that's the signal that structural checks have
hit their ceiling and a slower, prose-level pass earns its cost.

Each layer is small enough to be its own follow-up implementation issue rather than one large
change; none has been filed yet.
