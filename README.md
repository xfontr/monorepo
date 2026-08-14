# Budget Forecast

[![CI](https://github.com/xfontr/monorepo/actions/workflows/ci.yml/badge.svg)](https://github.com/xfontr/monorepo/actions/workflows/ci.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=xfontr_monorepo&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=xfontr_monorepo)

Personal budget forecasting app. A pnpm + Nx monorepo hosting the Nuxt frontend(s), the shared packages they build on, and the supporting services they depend on.

## 🗂️ Workspace layout

```
apps/
    external/         @monorepo/external — public-facing Nuxt 4 app
packages/
    configs/          @monorepo/configs — shared ESLint, Vitest and tsconfig presets
    i18n/             @monorepo/i18n — translations core + a Nuxt module
    observability/    @monorepo/observability — Grafana Faro in the browser, OpenTelemetry on the server
    ui/               @monorepo/ui — shared Vue 3 component library
infrastructure/
    translations/     @monorepo/translations — TMS serving the locale files over HTTP
```

`packages/*` is shared product code and the only thing `nx release` versions.
`apps/*` are the user-facing products. `infrastructure/*` holds the services that back them —
things an app talks to over the network rather than imports, each deployable on its own.
Translations is the first; a content backend would live here too.
Every project has its own README; start there for anything specific to it.

## 🧱 Architecture & boundaries

Projects are layered with Nx tags (declared in each `package.json` under `nx.tags`) and enforced by `@nx/enforce-module-boundaries` at lint time:

| Tag | May depend on | Who has it |
| --- | --- | --- |
| `type:app` | `type:feature`, `type:domain`, `type:ui`, `type:i18n`, `type:observability`, `type:config` | `external` |
| `type:feature` | `type:domain`, `type:ui`, `type:i18n`, `type:config` | — |
| `type:domain` | `type:domain`, `type:config` | — |
| `type:ui` | `type:ui`, `type:config` | `ui` |
| `type:i18n` | `type:config` | `i18n` |
| `type:observability` | `type:config` | `observability` |
| `type:infra` | `type:config` | `translations` |
| `type:config` | nothing | `configs` |

The rule of thumb: apps compose, everything else stays a leaf. `type:feature` and `type:domain`
are reserved for upcoming packages; no project uses them yet. The constraints live in
[`packages/configs/src/eslint/lib/boundaries.ts`](./packages/configs/src/eslint/lib/boundaries.ts).

## 🔧 Tooling conventions

- **pnpm catalog** — shared framework versions (nuxt, vue, vite, typescript, vitest, eslint…) are pinned once in `pnpm-workspace.yaml` and referenced as `catalog:` from each package.
- **Nx inferred targets** — there are no `project.json` files. Targets come from Nx plugins (`@nx/nuxt`, `@nx/eslint`, `@nx/vitest`, `@nx/vite`) and package scripts; project metadata lives in each `package.json` `nx` block.
- **Raw source packages** — internal packages export TypeScript/Vue source directly (no build step). Consumers (Nuxt/Vite) compile them.
- **Centralized configs** — every project's `eslint.config.ts` / `vitest.config.ts` / `tsconfig.json` is a thin wrapper around a factory or preset from `@monorepo/configs`.

## 🚀 Getting started

Requires the Node version in `.nvmrc` and pnpm (version pinned via `packageManager` in `package.json`).

```sh
pnpm install
pnpm exec nx serve @monorepo/external   # dev server
```

The app fetches its translations from a TMS at runtime, so it needs `TRANSLATIONS_VENDOR_*` set
before any page renders — see [`apps/external`](./apps/external/README.md) for which vars, and for
how to serve them locally instead.

Every command below runs against **affected** projects only (what changed since `master`), which is
also what CI runs. For the whole workspace instead, use `pnpm exec nx run-many -t <target>`.

| Command | What it does |
| --- | --- |
| `pnpm lint` | Lint affected projects |
| `pnpm typecheck` | Typecheck affected projects |
| `pnpm test` | Test affected projects |
| `pnpm build` | Build affected projects |
| `pnpm graph` | Open the Nx project graph |
| `pnpm release:dry` | Preview a release (versioning + changelogs) |

## 🌿 Git conventions

- Branches must match `^(hotfix|fix|feature|release)/.+` (enforced on push) — which also means you
  can't push straight to `master`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org) (enforced by commitlint).
- The pre-push hook runs `lint`, `test` and `typecheck` on affected projects.
- CI (GitHub Actions) re-runs the same affected targets plus `build` on every PR and on `master`.

## 🏷️ Versioning

Versions and changelogs are derived from commit messages by `nx release` — no manual bumps.

- Each `packages/*` project is versioned **independently**, from the commits that touched its files.
- `feat` → minor, `fix` → patch; `chore`, `refactor`, `docs`, `test`, `ci` and `style` don't bump. A
  `!` suffix or `BREAKING CHANGE:` footer → major.
- While a package is on `0.x`, Nx downshifts bumps one level (breaking → minor, feat → patch).
- Current versions come from git tags (`<projectName>@<version>`), falling back to `package.json`.
- Packages depending on a bumped package get a patch bump and a "Updated Dependencies" entry.

Run the **Release** workflow (`workflow_dispatch`) to cut versions. Leave `dry-run` on to preview;
tick `first-release` only when a project has no git tag yet. Locally: `pnpm release:dry`.
