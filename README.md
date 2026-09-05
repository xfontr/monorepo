# Monorepo

[![CI](https://github.com/xfontr/monorepo/actions/workflows/ci.yml/badge.svg)](https://github.com/xfontr/monorepo/actions/workflows/ci.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=xfontr_monorepo&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=xfontr_monorepo)

A pnpm + Nx monorepo hosting personal projects: Nuxt frontend(s), the shared packages they build
on, and the supporting services they depend on.

## 🗂 Workspace layout

```
apps/
    huella-legal/     @monorepo/huella-legal — Huella Legal, a WIP law blog redesign (Nuxt 4)
packages/
    configs/          @monorepo/configs — shared ESLint, Vitest and tsconfig presets
    content/          @monorepo/content — CMS entries and taxonomies + a Nuxt module
    i18n/             @monorepo/i18n — translations core + a Nuxt module
    observability/    @monorepo/observability — Grafana Faro in the browser, OpenTelemetry on the server
    ui/               @monorepo/ui — shared Vue 3 component library
infrastructure/
    translations/     @monorepo/translations — TMS serving the locale files over HTTP
    scripts/          @monorepo/scripts — repo-local dev tooling, one folder per script
```

`packages/*` is shared product code and the only thing `nx release` versions.
`apps/*` are the user-facing products. `infrastructure/*` holds what stays outside that release
pipeline and isn't user-facing either: services an app talks to over the network rather than
imports (translations), and repo-local dev tooling that isn't imported by anything at all
(scripts) — both `private: true`, each usable on its own. Note that `@monorepo/content` does *not*
belong here: it is a client for a CMS, and the CMS it talks to is hosted elsewhere.
Every project has its own README; start there for anything specific to it, and at
[`docs/`](./docs/README.md) for anything that spans projects — including
[`docs/FEATURES.md`](./docs/FEATURES.md), the generated index of every command, hook, workflow and
skill in the repo, which is the shortest answer to "what is in here".
[`docs/concepts/`](./docs/concepts/README.md) holds the *why* behind a model that spans projects —
the boundary table above is one; [`docs/guides/`](./docs/guides/README.md) holds the cross-project
procedures, first hour in the repo included.
[`docs/spikes/`](./docs/spikes/README.md) holds the answer once a spike issue gets one — the
issue is where the question lived, not where the outcome should have to survive.
[`docs/reviews/`](./docs/reviews/README.md) scores the whole tree against a fixed rubric, one dated
file per review, so that "is this getting better" has an answer that isn't a feeling.

## 🧱 Architecture & boundaries

Projects are layered with Nx tags (declared in each `package.json` under `nx.tags`) and enforced by
`@nx/enforce-module-boundaries` at lint time:

| Tag | May depend on | Who has it |
| --- | --- | --- |
| `type:app` | `type:feature`, `type:domain`, `type:ui`, `type:i18n`, `type:content`, `type:observability`, `type:config` | `huella-legal` |
| `type:feature` | `type:domain`, `type:ui`, `type:i18n`, `type:content`, `type:config` | — |
| `type:domain` | `type:domain`, `type:config` | — |
| `type:ui` | `type:ui`, `type:config` | `ui` |
| `type:i18n` | `type:config` | `i18n` |
| `type:content` | `type:config` | `content` |
| `type:observability` | `type:config` | `observability` |
| `type:infra` | `type:config` | `translations` |
| `type:tooling` | `type:config` | `scripts` |
| `type:config` | nothing | `configs` |

The rule of thumb: apps compose, everything else stays a leaf. `type:feature` and `type:domain`
are reserved for upcoming packages; no project uses them yet. The constraints live in
[`packages/configs/src/eslint/lib/boundaries.ts`](./packages/configs/src/eslint/lib/boundaries.ts).

## 🔧 Tooling conventions

- **pnpm catalog** — shared framework versions (nuxt, vue, vite, typescript, vitest, eslint…) are
  pinned once in `pnpm-workspace.yaml` and referenced as `catalog:` from each package.
- **Nx inferred targets** — there are no `project.json` files. Targets come from Nx plugins
  (`@nx/nuxt`, `@nx/eslint`, `@nx/vitest`, `@nx/vite`) and package scripts; project metadata lives in
  each `package.json` `nx` block.
- **Raw source packages** — internal packages export TypeScript/Vue source directly (no build step).
  Consumers (Nuxt/Vite) compile them.
- **Centralized configs** — a project's `eslint.config.ts` / `vitest.config.ts` / `tsconfig.json` is
  a thin wrapper around a factory or preset from
  [`@monorepo/configs`](./packages/configs/README.md). ESLint is the only one of the three that
  reaches every project; that README says where the other two don't.

## 🚀 Getting started

Requires the Node version in `.nvmrc` and pnpm (version pinned via `packageManager` in
`package.json`).

```sh
pnpm install
git config core.hooksPath .husky        # git hooks — a fresh clone has none until you do this
pnpm exec nx serve @monorepo/huella-legal   # dev server
```

That second line is not optional and nothing runs it for you. Husky normally installs itself from a
`prepare` script, and [lifecycle scripts are banned here](./CLAUDE.md) because both CI workflows
install with `--ignore-scripts` — so a hook hung off one works locally and silently does nothing
where it matters. Skip it and the [commit and push gates](#-git-conventions) below simply never
fire, which looks like a repo with no rules rather than a clone that isn't set up.

The app fetches both its translations and its articles over the network at runtime, so it needs
`NUXT_TRANSLATIONS_VENDOR_*` set before any page renders, and `NUXT_CONTENT_VENDOR_BASE_URL` before
`/articles` does. See [`apps/huella-legal`](./apps/huella-legal/README.md) for which vars, and for
how to serve the translations locally instead.

Every command below runs against **affected** projects only (what changed since `master`), which is
also what CI runs, except `pnpm test:coverage` — see its row below. For the whole workspace instead,
use `pnpm exec nx run-many -t <target>`.

| Command | What it does |
| --- | --- |
| `pnpm lint` | Lint affected projects |
| `pnpm typecheck` | Typecheck affected projects |
| `pnpm test` | Test affected projects |
| `pnpm test:coverage` | Test the **whole workspace** with a V8 coverage report, then merge every project's into one browsable [`coverage/index.html`](./infrastructure/scripts/src/coverage-report/README.md) |
| `pnpm build` | Build affected projects |
| `pnpm graph` | Open the Nx project graph |
| `pnpm docs:map` | Re-render [`docs/FEATURES.md`](./docs/FEATURES.md); `--check` asserts it is current |
| `pnpm release:dry` | Preview a release (versioning + changelogs) |

## 🌿 Git conventions

- Branches must match `^(hotfix|fix|feature|release)/.+` (enforced on push) — which also means you
  can't push straight to `master`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org) (enforced by
  commitlint via [`commitlint.config.mjs`](./commitlint.config.mjs), which just extends
  `@commitlint/config-conventional`): the type must be lower-case and the subject must not be
  sentence-case, start-case, Pascal-case or upper-case, so `feat: Add thing` is rejected and
  `feat: add thing` is not.
- The [`commit-msg`](./.husky/commit-msg) hook reads the issue number back out of the branch name
  and rewrites the subject to carry it, so `feat: add thing` on `feature/50-slug` is committed as
  `feat: [50] add thing`. Nobody types the tag, and re-running on an amend is a no-op instead of
  stacking a second one; a branch with no number in it is left alone. This is why the log here is
  number-first without anyone maintaining that.
- The pre-push hook runs `lint`, `test` and `typecheck` on affected projects, and rejects a push
  that adds a `TODO`/`FIXME` comment. It diffs only the commits being pushed, so a marker already
  in the tree never blocks you; the rejection points at
  [`pnpm issue:add`](./infrastructure/scripts/src/issue/README.md), which files the issue in a
  few prompts so the comment can go.
- [`pnpm issue:pick`](./infrastructure/scripts/src/issue/README.md#-pnpm-issuepick) goes the other
  way: pick an open issue off a project board and it creates and checks out
  `<type>/<issue number>-<slug>` for you and assigns you the issue, which is where the branch names
  in this repo come from.
- The hook also runs [`pnpm docs:drift`](./infrastructure/scripts/src/drift/README.md), which never
  fails the push: it warns when a changed project's docs look stale or the change is big, and offers
  to file an issue.
- Opening a PR from a branch that convention built triggers
  [`pr-metadata.yml`](./.github/workflows/pr-metadata.yml): it reads the issue number back out of
  the branch name and copies that issue's title, assignees and project onto the PR, so a PR never
  ships with GitHub's bare defaults. It runs on a `PROJECTS_TOKEN` PAT (`repo` + `project` scopes)
  because moving a PR onto a Projects (v2) board needs the `project` scope that `GITHUB_TOKEN`
  doesn't have. That secret isn't provisioned by anything — a repo without it fails the workflow
  with `gh`'s "set the GH_TOKEN environment variable" error on the first PR anyone opens. To fix it:
  generate a classic PAT ([github.com/settings/tokens](https://github.com/settings/tokens) →
  **Generate new token (classic)**) scoped to `repo` and `project`, then add it as
  `gh secret set PROJECTS_TOKEN --repo xfontr/monorepo` (or Settings → Secrets and variables →
  Actions in the browser). Re-run the failed workflow run once it's set — no new PR needed.
- CI (GitHub Actions) re-runs the same affected targets plus `build` on every PR and on `master`.

## 🏷 Versioning

Versions and changelogs are derived from commit messages by `nx release` — no manual bumps.

- Each `packages/*` project is versioned **independently**, from the commits that touched its files.
- `feat` → minor, `fix` → patch; `chore`, `refactor`, `docs`, `test`, `ci` and `style` don't bump.
  A `!` suffix or `BREAKING CHANGE:` footer → major.
- While a package is on `0.x`, Nx downshifts bumps one level (breaking → minor, feat → patch).
- Current versions come from git tags (`<projectName>@<version>`), falling back to `package.json`.
- Packages depending on a bumped package get a patch bump and a "Updated Dependencies" entry.

Run the **Release** workflow ([`release.yml`](./.github/workflows/release.yml), `workflow_dispatch`)
to cut versions. Leave `dry-run` on to preview;
tick `first-release` only when a project has no git tag yet. Locally: `pnpm release:dry`.

The workflow's final push runs as `github-actions[bot]` via `GITHUB_TOKEN`, which the `master`
branch ruleset's PR and required-status-check rules don't exempt — that push needs a
`RELEASE_TOKEN` PAT belonging to an account the ruleset's bypass list covers (an admin, today).
That secret isn't provisioned by anything — a repo without it gets the release commit and tags
built locally, then `git push --follow-tags` rejected with GitHub's "Changes must be made through
a pull request" error. To fix it: generate a classic PAT
([github.com/settings/tokens](https://github.com/settings/tokens) → **Generate new token
(classic)**) on an account with bypass rights, scoped to `repo`, then add it as
`gh secret set RELEASE_TOKEN --repo xfontr/monorepo` (or Settings → Secrets and variables →
Actions in the browser). Re-run the failed workflow run once it's set.
