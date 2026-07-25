# Budget Forecast

[![CI](https://github.com/xfontr/budget-forecast/actions/workflows/ci.yml/badge.svg)](https://github.com/xfontr/budget-forecast/actions/workflows/ci.yml)

Personal budget forecasting app. A pnpm + Nx monorepo hosting the Nuxt frontend(s) and the shared packages they build on.

## 🗂️ Workspace layout

```
apps/
    external/       @budget-forecast/external — public-facing Nuxt 4 app
packages/
    configs/        @budget-forecast/configs — shared ESLint, Vitest and tsconfig presets
    i18n/           @budget-forecast/i18n — shared translations (locale file paths)
    ui/             @budget-forecast/ui — shared Vue 3 component library
```

## 🧱 Architecture & boundaries

Projects are layered with Nx tags (declared in each `package.json` under `nx.tags`) and enforced by `@nx/enforce-module-boundaries` at lint time:

| Tag | May depend on |
| --- | --- |
| `type:app` | `type:feature`, `type:domain`, `type:ui`, `type:i18n`, `type:config` |
| `type:feature` | `type:domain`, `type:ui`, `type:i18n`, `type:config` |
| `type:domain` | `type:domain`, `type:config` |
| `type:ui` | `type:ui`, `type:config` |
| `type:i18n` | `type:config` |
| `type:config` | nothing |

`type:feature` and `type:domain` are reserved for upcoming packages; no project uses them yet.

## 🔧 Tooling conventions

- **pnpm catalog** — shared framework versions (nuxt, vue, vite, typescript, vitest, eslint…) are pinned once in `pnpm-workspace.yaml` and referenced as `catalog:` from each package.
- **Nx inferred targets** — there are no `project.json` files. Targets come from Nx plugins (`@nx/nuxt`, `@nx/eslint`, `@nx/vitest`, `@nx/vite`) and package scripts; project metadata lives in each `package.json` `nx` block.
- **Raw source packages** — internal packages export TypeScript/Vue source directly (no build step). Consumers (Nuxt/Vite) compile them.
- **Centralized configs** — every project's `eslint.config.ts` / `vitest.config.ts` / `tsconfig.json` is a thin wrapper around a factory or preset from `@budget-forecast/configs`.

## 🚀 Getting started

Requires the Node version in `.nvmrc` and pnpm (version pinned via `packageManager` in `package.json`).

```sh
pnpm install
pnpm exec nx serve @budget-forecast/external   # dev server
```

| Command | What it does |
| --- | --- |
| `pnpm lint` | Lint affected projects |
| `pnpm typecheck` | Typecheck affected projects |
| `pnpm test` | Test affected projects |
| `pnpm build` | Build affected projects |
| `pnpm graph` | Open the Nx project graph |
| `pnpm release:dry` | Preview a release (versioning + changelogs) |

## 🌿 Git conventions

- Branches must match `^(hotfix|fix|feature|release)/.+` (enforced on push).
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
