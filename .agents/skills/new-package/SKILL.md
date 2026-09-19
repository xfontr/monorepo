---
name: new-package
description: Scaffold a new project in this monorepo under packages/, apps/ or infrastructure/ — package.json with Nx tags and an exports map, the three wrapper configs, a README, and the boundary wiring. Use when adding a new workspace project, a new shared package, a new app, or a new infrastructure service.
---

# Scaffolding a workspace project

Six files have to agree, and two of them live outside the new directory. That is the whole reason
this skill exists — a scaffold that forgets step 5 lints clean until someone imports it.

## 1. Pick the root

| Root | For | Released? |
| --- | --- | --- |
| `packages/` | Shared product code an app imports | Yes — `nx.json` sets `release.projects: ["packages/*"]` |
| `apps/` | A user-facing product | No — mark it `"private": true` |
| `infrastructure/` | A service apps reach **over the network** (`translations`), or repo-local dev tooling nothing imports (`scripts`) — either way, deployable/runnable on its own | No — mark it `"private": true` |

The directory name is the package name: `packages/foo` → `@monorepo/foo`. Infrastructure is not
separately namespaced (`infrastructure/translations` → `@monorepo/translations`).

## 2. `package.json`

Copy the shape from the closest sibling rather than writing it fresh —
[`packages/observability/package.json`](../../../packages/observability/package.json) is the
plainest example, [`packages/content/package.json`](../../../packages/content/package.json) the one
with two entry points and optional peers. 2-space indent, because pnpm rewrites it that way.

```json
{
  "name": "@monorepo/<dirname>",
  "version": "0.0.1",
  "description": "<three words, no marketing>",
  "author": "Xifré Font",
  "license": "ISC",
  "type": "module",
  "exports": { ".": { "import": "./src/index.ts" } },
  "scripts": {
    "lint": "nx eslint:lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest . --watch=false",
    "test:dev": "vitest .",
    "test:coverage": "vitest . --watch=false --coverage"
  },
  "nx": { "tags": ["type:<kind>", "scope:<area>"] },
  "devDependencies": {
    "@monorepo/configs": "workspace:*",
    "@types/node": "catalog:",
    "@vitest/coverage-v8": "catalog:",
    "eslint": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

- **No build step**: the `exports` map points at source. No `main`, no `types`, no `dist`.
- **Exactly two Nx tags**, `type:<kind>` and `scope:<area>`. They live here, not in a
  `project.json` — there are none in this workspace.
- If the package has internal layers, add Node subpath imports the way `content` and `i18n` do:
  `"imports": { "#core/*": "./src/core/*.ts" }`. Use them internally instead of `../../`.
- A second entry point (a framework integration) goes in the `exports` map with its framework deps
  as **optional peer dependencies**, so a consumer of the first entry point installs none of them.

## 3. The three wrapper configs

Never hand-roll these. Each is a one-liner over a `@monorepo/configs` factory:

```ts
// eslint.config.ts
import { eslint } from "@monorepo/configs";

export default eslint.createNodeConfig();   // or createVueConfig() / createNuxtConfig()
```

```ts
// vitest.config.ts
import { vitest } from "@monorepo/configs";

export default vitest.createNodeConfig();   // or createVueConfig(viteConfig)
```

```json
// tsconfig.json
{
    "extends": "@monorepo/configs/tsconfig/node.json",
    "include": ["src", "eslint.config.ts"]
}
```

`tsconfig/base.json` when the package needs no Node types, `tsconfig/node.json` when it does.

## 4. `README.md`

Follow the `house-docs` skill. A new package's README earns its keep by saying what the package is
*for* and what it deliberately does not do — not by listing its files.

## 5. The boundary wiring — the step that gets skipped

If the project introduces a **new** `type:` tag, three edits, all outside the new directory:

1. Add its own `depConstraints` entry to
   [`boundaries.ts`](../../../packages/configs/src/eslint/lib/boundaries.ts). A leaf package gets
   `onlyDependOnLibsWithTags: ["type:config"]` — the rule of thumb is that apps compose and
   everything else stays a leaf.
2. Add the new tag to the `onlyDependOnLibsWithTags` of whatever is allowed to consume it — usually
   `type:app`, sometimes `type:feature` too.
3. Add the row to the tag table in the [root README](../../../README.md#-architecture--boundaries).
   It is the readable copy of the same rules and it drifts the moment you forget.

## 6. The root README

Add the project to the workspace-layout block, in its root's group, with the same
`@monorepo/name — one line` form as its neighbours.

## 7. Verify

```sh
pnpm install
pnpm exec nx show project @monorepo/<name>    # targets inferred from the scripts and plugins?
pnpm exec nx run-many -t lint typecheck test --projects @monorepo/<name>
```

If `lint` passes but the package is unreachable from its consumer, the tag wiring in step 5 is
what to check.
