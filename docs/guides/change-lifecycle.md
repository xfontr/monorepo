# 🔄 A change, end to end

What happens between picking an issue and it becoming a released version. No single README owns
this: the root README carries two fragments of it (Git conventions, Versioning), and the subject
injection into commit messages appears in neither.

## 1. Pick the issue, get the branch

```sh
pnpm issue:pick
```

Walks a project board, lists its open issues, and — once you pick one — creates
`<type>/<issue number>-<slug>`, checks it out, and assigns you the issue. `<type>` is one of
`hotfix`/`fix`/`feature`/`release`, the only prefixes the push gate in step 3 accepts. Everything
downstream reads the issue number back out of this branch name, so a branch made by hand without
one of these prefixes and a leading number opts out of steps 2 and 4 silently rather than failing
loudly.

## 2. Commit

The [`commit-msg`](../../.husky/commit-msg) hook runs before `commitlint` sees your message. It
reads the issue number out of the current branch name and rewrites the subject to carry it —
`feat: Add thing` on `feature/50-slug` becomes `feat: [50] Add thing` — then hands the result to
`commitlint`, which enforces Conventional Commits plus two extra rules: the type is lower-case, the
subject is sentence case. Amending the same commit on the same branch is a no-op rewrite, not a
second tag stacking on the first.

## 3. Push

[`pre-push`](../../.husky/pre-push) runs, in order, against only the commits being pushed (not the
whole working tree):

1. **Branch name** must match `^(hotfix|fix|feature|release)/.+`, or the push is rejected outright.
2. **TODO/FIXME scan** over the diff of what's being pushed — a new one blocks the push and points
   at `pnpm issue:add` to file it properly instead.
3. **Docs drift check** (`pnpm docs:drift`) — a nudge, never a gate. It warns when the changed
   project's docs look stale and offers to file an issue, but always exits 0.
4. **Lint, test, typecheck**, each against affected projects — any failure blocks the push.

## 4. Open the PR

Opening a PR from a branch that steps 1–3 built triggers
[`pr-metadata.yml`](../../.github/workflows/pr-metadata.yml): it reads the issue number back out of
`head_ref`, reads that issue's title, assignees and project via `gh`, and copies all three onto the
PR — so the PR never ships with GitHub's bare "same as branch name" defaults. This runs on a
`PROJECTS_TOKEN` classic PAT (`repo` + `project` scopes) rather than the default `GITHUB_TOKEN`,
because adding a PR to a Projects (v2) board needs the `project` scope the default token never
carries, and forks never get this PAT at all — the workflow no-ops on a fork's PR.

## 5. CI

Every PR, and every push to `master`, re-runs `lint`, `typecheck` and `test` against affected
projects — the same targets the pre-push hook already ran locally — plus `build`, which pre-push
does not. That's the one asymmetry worth knowing before trusting a green push: `apps/huella-legal`
typechecks as part of its build, which is where a local pass and a red CI run most often diverge.

## 6. Merge, then release — separately

Merging to `master` is not a release. Versions and changelogs are cut only by running the
**Release** workflow (`workflow_dispatch`) by hand, which computes each `packages/*` project's
version from the Conventional Commit messages that touched it since its last tag — never from a
number anyone typed. [`docs/concepts/versioning.md`](../concepts/versioning.md) covers why that
chain is built the way it is; this guide stops at "it's a separate, manual step."

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Release triggered automatically on merge | Would remove the manual `workflow_dispatch` step here — not the current design, and changing it is a decision for [`docs/spikes/`](../spikes/README.md), not a silent edit to this file |
