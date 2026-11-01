# 🤖 The agent setup as one inspectable system

The repository's agent guidance is Claude Code's native layout: `CLAUDE.md` files for always-on
guidance, fifteen skills under [`.claude/skills/`](../../.claude/skills/) for task-specific
procedures, and settings, hooks and subagents beside them under `.claude/`. Every one of them is
tracked and edited in place.

## 📄 Why `CLAUDE.md` reads the way it does

The root file says outright what it is for: what the READMEs do not say, or what gets done wrong
anyway. It is not project documentation restated for a machine — the actual documentation is the
READMEs, which a human and an agent both read. `CLAUDE.md` exists where a plain reading of the code
has produced a wrong edit before: style rules, the "looks reasonable and is wrong here" list and
the pairs of files that must agree.

Every project's `CLAUDE.md` follows the same shape: a short pointer to its README, then the
invariants worth losing a build over. Claude loads the root file on every turn and a project's file
once it reads something in that project.

## 🪝 The hooks

Two `PostToolUse` hooks fire after every edit, and one `PreToolUse` hook before every shell
command.

| Hook | Enforces |
| --- | --- |
| [`eslint-fix.sh`](../../.claude/hooks/eslint-fix.sh) | Runs `eslint --fix` on the touched file, so style is corrected mechanically |
| [`check-invariants.sh`](../../.claude/hooks/check-invariants.sh) | Catches known cross-file and generated-file mistakes immediately after an edit |
| [`guard-live.sh`](../../.claude/hooks/guard-live.sh) | Refuses `pnpm start`, `nuxt preview`, requests to the live WordPress site, force pushes and pushes to `master`: the things an unattended run must never do, whatever its prompt says |

The same invariant checks run independently in scripts and CI where practical. Claude's hook is
earlier feedback, not the only authority, so an edit made by hand reaches the same repository
gate.

## 🚫 What the deny list forecloses

[`.claude/settings.json`](../../.claude/settings.json) denies editing generated changelogs and the
feature map, running a release and reading real `.env` files. These are guardrails over rules
stated in [`CLAUDE.md`](../../CLAUDE.md): generated artifacts have a named renderer, and real
environment values are outside the repository's documentation surface.

## 🛠 What the skills are collectively

A skill loads for a matching task rather than on every turn. The split keeps always-applicable
invariants in `CLAUDE.md` while detailed procedures such as adding a package, writing a spec or
filing an issue stay out of unrelated context. [`docs/FEATURES.md`](../FEATURES.md) lists every
skill and its source; the map is rendered by `pnpm docs:map`, never maintained by hand.

## 🚢 The ship-issue pipeline

[`ship-issue.js`](../../.claude/workflows/ship-issue.js) takes issues to merged PRs with no human
reading the code: `/ship-issue 340 341`. Issues run strictly one after another, because each one
branches off the `master` the previous one merged into, and because only one `pnpm check` should
run at a time.

| Stage | Who | Stops the run when |
| --- | --- | --- |
| Pick | `pnpm issue:pick`, then `pnpm issue:brief` | The tree is dirty or the pick fails |
| Plan | [`ticket-planner`](../../.claude/agents/ticket-planner.md) | The issue needs a structure with no precedent, or a choice the issue leaves open |
| Implement | A general agent following the plan, then `pnpm check` | `check` is still red after two fixes |
| Review | [`review-architecture`](../../.claude/agents/review-architecture.md), [`review-tests`](../../.claude/agents/review-tests.md) and [`review-correctness`](../../.claude/agents/review-correctness.md) in parallel, then a fixer | Blocking findings survive two fix rounds |
| Polish | `comment-cleanup` and `doc-drift-check` | `check` goes red |
| Ship | Conventional commits, then [`pnpm issue:ship`](../../infrastructure/scripts/src/ship/README.md) | The required checks fail after one repair, or the PR never merges |

The planner is the only stage that decides structure, and it decides nothing new: every file it
plans names the existing path it copies, so an unattended run can't invent a convention. Reviewers
get the issue and the diff, never the implementer's account of it, so they judge the code rather
than the story about it.

Run it from a checkout no other session writes to: `pnpm worktree:prepare` makes one. The ship step
commits only the paths the run reported touching, and stops rather than commit anything else it
finds dirty.

A stopped run labels the issue or PR `needs-human`, comments why, and leaves later issues
unstarted. The pipeline's `git` and `gh` permissions live in each machine's
`.claude/settings.local.json`, so a fresh clone prompts for them until they're allowed there.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A second agent with a different discovery convention | Pick one editable tree and generate the other from it; two hand-kept copies drift |
| A runtime hook another tool can run too | Move the check into a script both call; until then scripts and CI remain the shared authority |
| Coverage that fails a PR | CI runs `test` without `--coverage`, so thresholds never gate a merge. A project built by `ship-issue` should put `--coverage` in its own `test` script, with thresholds in its `vitest.config.ts` |
| Lint for what only `review-architecture` checks today | A scoped `no-restricted-imports` per project, like [`coreIsolation.ts`](../../packages/configs/src/eslint/lib/coreIsolation.ts). A second config setting that rule on `app/` or `server/` replaces [`layerIsolation.ts`](../../packages/configs/src/eslint/lib/layerIsolation.ts) rather than merging with it, so it needs a spec |
| Tests that pass `review-tests` and are still weak | Mutation testing (Stryker) on a project's domain code, as a dependency check-in |
| Proof that `guard-live.sh` fires inside workflow agents | Claude Code documents settings hooks applying inside subagents, not workflow agents specifically; the first `ship-issue` run should try a blocked command |
