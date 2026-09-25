# 🏷 How a version gets derived from a commit

The [root README](../../README.md#-versioning) states the mechanics — `nx release`, no manual
bumps, `feat`/`fix`/`!` map to minor/patch/major. What it doesn't spell out is why the whole chain
upstream of that command is built to leave it no other choice, which is the actual guarantee: a
version number in this repo is never someone's judgment call.

## 🔗 The chain from keystroke to bump

1. **[`commit-msg`](../../.husky/commit-msg)** threads the issue number from the branch name into
   the subject, then hands the message to `commitlint`, which applies
   `@commitlint/config-conventional` with no overrides.
2. A rejected commit never lands, so by the time anything reaches `master` every commit message is
   a value `nx release` can parse without guessing. The type-to-bump table is in the
   [root README](../../README.md#-versioning).
3. **`nx release`** computes each `packages/*` project's version and changelog from the commits
   that touched it since its last tag — never from what's currently written in `package.json`.

Nothing in that chain reads a number a human typed. `check-invariants.sh` closes the one gap that
would otherwise exist — an agent editing `package.json`'s `version` field by hand — by rejecting the
edit outright when the old and new values differ.

## 🎯 Why independent, package-scoped bumps

Each `packages/*` project is versioned from its own commits, not the repo's. A `fix` in `ui` and a
`feat` in `i18n` land in the same PR and produce two different bumps on two different tags, not one
repo-wide version. That's what makes "bump this one package" a coherent question at all — a single
repo version would force every consumer of `packages/i18n` to also absorb whatever noisy `chore`
commits happened to land in `packages/ui` the same week, with nothing about the change actually
touching their code.

The one extra rule beyond that: a package that depends on a bumped package gets a patch bump of its
own plus an "Updated Dependencies" changelog entry, even with zero commits of its own. That's the
mechanism that keeps a consumer's declared dependency version honest without anyone remembering to
touch it by hand.

## 🐣 Why `0.x` downshifts

While a package is on `0.x`, a `feat!`/`BREAKING CHANGE` maps to a minor bump instead of major, and
a plain `feat` maps to patch instead of minor. Semver itself treats `0.x` as "anything can break, no
promises yet" — every package here starts there, and downshifting keeps that window from forcing an
early jump to `1.0.0` off a single `feat` commit before the package has any real consumers to break.

## 🚫 Why release only runs from the workflow

`pnpm exec nx release`, `nx release` and `pnpm release` are all denied in
[`.claude/settings.json`](../../.claude/settings.json), and the only sanctioned way to cut a
version is the **Release** workflow (`workflow_dispatch`) — `pnpm release:dry` locally previews
without publishing anything. A version and a changelog entry are derived facts, and deriving them
locally on one machine, with whatever commits happen to be checked out there, is exactly the manual
bump the rest of the chain exists to avoid.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A repo-wide version (a single release train) | Would mean abandoning independent package versioning — not a config flag, a different model, and not one this repo has needed with one real app |
| Pre-releases / release channels | `nx release` supports them; nothing here uses one yet because there's no consumer waiting on a beta |
