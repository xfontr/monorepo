# Monorepo

[![CI](https://github.com/xfontr/monorepo/actions/workflows/ci.yml/badge.svg)](https://github.com/xfontr/monorepo/actions/workflows/ci.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=xfontr_monorepo&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=xfontr_monorepo)
[![Netlify Status](https://api.netlify.com/api/v1/badges/cae76234-bf69-4487-9dee-505f9a006250/deploy-status)](https://app.netlify.com/projects/monorepo-idp/deploys)
[![Developer Portal deploy](https://github.com/xfontr/monorepo/actions/workflows/developer-portal-deploy.yml/badge.svg)](https://github.com/xfontr/monorepo/actions/workflows/developer-portal-deploy.yml)
[![Release](https://github.com/xfontr/monorepo/actions/workflows/release.yml/badge.svg)](https://github.com/xfontr/monorepo/actions/workflows/release.yml)
[![Netlify deployment](https://github.com/xfontr/monorepo/actions/workflows/netlify-deployment.yml/badge.svg)](https://github.com/xfontr/monorepo/actions/workflows/netlify-deployment.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/xfontr/monorepo/badge.svg)](https://snyk.io/test/github/xfontr/monorepo)

A pnpm + Nx monorepo hosting personal projects: Nuxt frontend(s), the shared packages they build
on, and the supporting services they depend on.

## 🗂 Workspace layout

```
apps/
    huella-legal/     @monorepo/huella-legal — Huella Legal, a WIP law blog redesign (Nuxt 4)
    developer-portal/ @monorepo/developer-portal — the repository's public portal/front door over its docs, projects, architecture and engineering health
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
[`docs/decisions/`](./docs/decisions/README.md) holds the answer once a spike issue gets one — the
issue is where the question lived, not where the outcome should have to survive.
[`docs/audits/`](./docs/audits/README.md) holds what a static read of one project found wrong, each
finding numbered and carrying its own status, so the backlog outlives the session that found it.
[`docs/reviews/`](./docs/reviews/README.md) scores the whole tree against a fixed rubric, one dated
file per review, so that "is this getting better" has an answer that isn't a feeling.

## 🧱 Architecture & boundaries

Projects are layered with Nx tags (declared in each `package.json` under `nx.tags`) and enforced by
`@nx/enforce-module-boundaries` at lint time:

| Tag | May depend on | Who has it |
| --- | --- | --- |
| `type:app` | `type:feature`, `type:domain`, `type:ui`, `type:i18n`, `type:content`, `type:observability`, `type:config` | `developer-portal`, `huella-legal` |
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
pnpm quick-start                        # hooks, workspace coverage and developer-portal snapshot
pnpm agents:sync                        # Claude adapters; Codex reads the sources directly
pnpm dev                                # pick a project to start
```

`pnpm dev` is the only one of those commands that survives being run first: it installs the workspace
itself if `node_modules` isn't there yet, then asks which project to start. See
[`infrastructure/scripts/src/dev`](./infrastructure/scripts/src/dev/README.md).

That second line makes a clone useful beyond compiling: it installs Git hooks, runs the workspace's
coverage suite and writes the developer portal's snapshot from the current tree. Husky normally
installs itself from a `prepare` script, and [lifecycle scripts are banned here](./AGENTS.md) because
every workflow that installs uses `--ignore-scripts` — so a hook hung off one works locally and
silently does nothing where it matters. Skip setup and the [commit and push gates](#-git-conventions) below
simply never fire, while the portal has no current coverage or derived docs to show.

`huella-legal` fetches both its translations and its articles over the network at runtime, so it
needs `NUXT_TRANSLATIONS_VENDOR_*` set before any page renders, and `NUXT_CONTENT_VENDOR_BASE_URL`
before `/articles` does. See [`apps/huella-legal`](./apps/huella-legal/README.md) for which vars,
and for how to serve the translations locally instead.

The everyday commands. [`docs/FEATURES.md`](./docs/FEATURES.md) lists every other one — the
`issue:*` scripts, `docs:drift`, `review:version`, `package:check` — with the doc that explains it.
The ones that take a target run against **affected** projects only (what changed since `master`),
which is also what CI runs, except `pnpm test:coverage`. For the whole workspace instead, use
`pnpm exec nx run-many -t <target>`.

| Command | What it does |
| --- | --- |
| `pnpm quick-start` | Install Git hooks for this clone, collect coverage for the workspace, then refresh the developer portal's snapshot |
| `pnpm dev` | Pick a project and start its dev server — `pnpm dev developer-portal` skips the picker. Installs the workspace first if this is a fresh clone |
| `pnpm lint` | Lint affected projects |
| `pnpm typecheck` | Typecheck affected projects |
| `pnpm test` | Test affected projects |
| `pnpm test:coverage` | Test the **whole workspace** with a V8 coverage report, then merge every project's into one browsable [`coverage/index.html`](./infrastructure/scripts/src/coverage-report/README.md) |
| `pnpm build` | Build affected projects |
| `pnpm graph` | Open the Nx project graph |
| `pnpm agents:sync` | Render ignored Claude adapters from canonical `AGENTS.md` files and `.agents/skills/`; `--check` reports local drift |
| `pnpm docs:map` | Re-render [`docs/FEATURES.md`](./docs/FEATURES.md); `--check` asserts it is current |
| `pnpm release:dry` | Preview a release (versioning + changelogs) |

## 🌿 Git conventions

The rules, each enforced by a hook or a workflow. The order they fire in, and what each gate
checks, is in [`docs/guides/change-lifecycle.md`](./docs/guides/change-lifecycle.md).

- Branches must match `^(hotfix|fix|feature|release)/[^/]+/[0-9]+-.+` (enforced on push), so
  `master` can't be pushed to. [`pnpm issue:pick`](./infrastructure/scripts/src/issue/README.md#-pnpm-issuepick)
  creates one from an issue on a project board.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org), enforced by
  commitlint through [`commitlint.config.mjs`](./commitlint.config.mjs). The
  [`commit-msg`](./.husky/commit-msg) hook tags the subject with the branch's issue number
  (`feat: [#50] add thing`), which is why the log here is number-first without anyone typing it.
- [`pre-commit`](./.husky/pre-commit) blocks a commit while `docs/FEATURES.md` or the review
  method version is stale.
- [`pre-push`](./.husky/pre-push) rejects a bad branch name or an added `TODO`/`FIXME` comment,
  then runs lint, test and typecheck on affected projects. File a flagged comment with
  [`pnpm issue:add`](./infrastructure/scripts/src/issue/README.md) and delete it.
- [`pnpm issue:ship`](./infrastructure/scripts/src/ship/README.md) pushes, opens the PR and arms
  auto-merge. Auto-merge and delete-branch-on-merge are on for this repo.
- A PR gets its title, assignees and project from the issue
  ([`pr-metadata.yml`](./.github/workflows/pr-metadata.yml)), path labels
  ([`pr-labeler.yml`](./.github/workflows/pr-labeler.yml)) and an advisory docs review
  ([`docs-review.yml`](./.github/workflows/docs-review.yml)). Non-major Dependabot PRs get
  auto-merge armed by [`dependabot-auto-merge.yml`](./.github/workflows/dependabot-auto-merge.yml).
- [`post-checkout`](./.husky/post-checkout) and [`post-merge`](./.husky/post-merge) warn when a branch
  operation changes `pnpm-lock.yaml`. They never install anything and never block.
- [`pnpm docs:drift`](./infrastructure/scripts/src/drift/README.md) is a manual check for a range
  whose project docs may have gone stale. No hook runs it.
- Four workflows need secrets nothing provisions — `PROJECTS_TOKEN`, `NX_CLOUD_ACCESS_TOKEN`,
  `RELEASE_TOKEN` and `COPILOT_GITHUB_TOKEN`. [`docs/guides/repo-secrets.md`](./docs/guides/repo-secrets.md)
  has what each one is for and how a missing one shows up.

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
tick `first-release` only when a project has no git tag yet. Locally: `pnpm release:dry`. Its final
push needs the `RELEASE_TOKEN` secret — see [`docs/guides/repo-secrets.md`](./docs/guides/repo-secrets.md).
