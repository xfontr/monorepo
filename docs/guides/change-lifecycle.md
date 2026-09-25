# 🔄 A change, end to end

What happens between picking an issue and it becoming a released version. This guide is the one
place the whole flow is written down: the root README keeps only the rules
([Git conventions](../../README.md#-git-conventions), [Versioning](../../README.md#-versioning)),
and each step below links to the hook, script or workflow that does it.

## 1. Pick the issue, get the branch

```sh
pnpm issue:pick
```

Walks a project board, lists its open issues, and — once you pick one — creates
`<type>/<project>/<issue number>-<slug>`, checks it out, and assigns you the issue. `<type>` is one
of `hotfix`/`fix`/`feature`/`release`, the only prefixes the push gate in step 3 accepts, and
`<project>` is the slugified title of the board you just walked. Everything downstream reads the
issue number back out of this branch name, so a branch made by hand without one of these prefixes,
a project segment and a following number opts out of steps 2 and 5 silently rather than failing
loudly.

## 2. Commit

The [`pre-commit`](../../.husky/pre-commit) hook runs `pnpm docs:map --check` and
`pnpm review:version --check`. A stale generated feature map or an unrecorded review-method change
blocks the commit.

The [`commit-msg`](../../.husky/commit-msg) hook runs before `commitlint` sees your message. It
reads the issue number out of the current branch name and rewrites the subject to carry it —
`feat: add thing` on `feature/website/50-slug` becomes `feat: [#50] add thing` — then hands the
result to `commitlint`. Amending the same commit on the same branch is a no-op rewrite, not a second
tag stacking on the first, and a branch with no number leaves the message alone.

`commitlint` applies `@commitlint/config-conventional` with no overrides. Two of its rules aren't
obvious from a rejection message: the type is lower-case, and the subject is **not** sentence-case,
start-case, Pascal-case or upper-case — so `feat: add thing` passes and `feat: Add thing` does not.

## 3. Push

[`pre-push`](../../.husky/pre-push) runs, in order:

1. **Branch name** must match `^(hotfix|fix|feature|release)/[^/]+/[0-9]+-.+`, or the push is
   rejected outright. This is also what makes `master` unpushable.
2. **TODO/FIXME scan** over the diff of the commits being pushed — the only range-based step. A new
   marker blocks the push and points at `pnpm issue:add` to file it instead. A branch's first push
   diffs against the empty tree, so there every marker in the tree counts as new.
3. **`pnpm audit`**, over the whole workspace, skipped when the push only deletes a branch. It never
   fails the push.
4. **Lint, test, typecheck**, each against affected projects in the working tree — any failure
   blocks the push. Uncommitted and staged changes are checked too, so a dirty tree can pass or fail
   differently from the commits actually being pushed.

## 4. Ship

```sh
pnpm issue:ship
```

[`issue:ship`](../../infrastructure/scripts/src/ship/README.md) pushes the current branch (so step 3
runs), opens or reuses its PR, arms GitHub's auto-merge, then blocks until every check concludes and
reports whether the PR merged or a check failed. Pushing and opening the PR by hand reaches the same
place.

## 5. The PR fills itself in

Opening a PR from a branch that steps 1–3 built triggers
[`pr-metadata.yml`](../../.github/workflows/pr-metadata.yml): it reads the branch type and issue
number back out of `head_ref`, reads that issue's title, assignees and project via `gh`, and copies
assignees and project onto the PR as-is while tagging the title with the branch type and issue
number (`feature: [48] <issue title>`) — so the PR never ships with GitHub's bare "same as branch
name" defaults. It needs the `PROJECTS_TOKEN` secret, and forks never get it — the workflow no-ops
on a fork's PR. [`repo-secrets.md`](./repo-secrets.md) covers provisioning it.

[`pr-labeler.yml`](../../.github/workflows/pr-labeler.yml) adds architectural path labels, and
[`docs-review.yml`](../../.github/workflows/docs-review.yml) posts an advisory documentation-drift
review when the PR plausibly changes a documented public surface. Neither is a required check.

## 6. CI

Every PR, and every push to `master`, runs [`ci.yml`](../../.github/workflows/ci.yml):

| Step | Runs on | Pre-push ran it? |
| --- | --- | --- |
| `lint`, `typecheck`, `test` | Affected projects | Yes |
| `build` | Affected projects | No |
| `pnpm docs:map --check` | The whole workspace | No — pre-commit did |
| `pnpm review:version --check` | The whole workspace | No — pre-commit did |
| `actions/dependency-review-action` | The PR's own diff, `warn-only` | No — the local stand-in is `pnpm audit` |

`build` is the asymmetry worth knowing before trusting a green push: `apps/huella-legal` typechecks
as part of its build, which is where a local pass and a red CI run most often diverge.

The `master` ruleset requires one approving review, but repo admins are a standing bypass actor, so
a self-opened PR only waits on CI. Dependabot isn't a bypass actor: its non-major PRs get
auto-merge armed by [`dependabot-auto-merge.yml`](../../.github/workflows/dependabot-auto-merge.yml)
and still wait on both CI and the approval, which [`CODEOWNERS`](../../.github/CODEOWNERS) routes.

## 7. Merge, then release — separately

Merging to `master` is not a release. Versions and changelogs are cut only by running the
**Release** workflow (`workflow_dispatch`) by hand, which computes each `packages/*` project's
version from the Conventional Commit messages that touched it since its last tag — never from a
number anyone typed. The [root README](../../README.md#-versioning) has the bump rules, and
[`docs/concepts/versioning.md`](../concepts/versioning.md) covers why the chain is built the way it
is; this guide stops at "it's a separate, manual step."

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Release triggered automatically on merge | Would remove the manual `workflow_dispatch` step here — not the current design, and changing it is a decision for [`docs/decisions/`](../decisions/README.md), not a silent edit to this file |
| Pre-push checking exactly the pushed commits | Lint, test and typecheck would have to run in a temporary checkout of `$LOCAL_SHA`. Worth it only if a dirty tree passing the hook starts letting red commits through |
