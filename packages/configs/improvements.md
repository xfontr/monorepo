# `@budget-forecast/configs` — improvements

Outstanding cleanup items for the shared ESLint/Vitest config package.

## A. Dead dependencies

Remove from [`package.json`](./package.json) — neither is imported anywhere:

- `eslint-config-prettier` — formatting is handled by `@stylistic`, so the
  prettier-disable layer is moot.
- `@typescript-eslint/utils` — never imported.

## B. Bugs / things silently not working

- **Test-file glob mismatch.** [`src/eslint/node.ts`](./src/eslint/node.ts)
  targets `**/*.test.ts`, but the repo's tests are named `*.spec.ts`
  (`Button.spec.ts`, `index.spec.ts`). The `@vitest` lint rules therefore apply
  to **zero files**. Should be `*.spec.ts` (or both).
- **Vue config has no vitest block at all.**
  [`src/eslint/vue.ts`](./src/eslint/vue.ts) never registers the `@vitest`
  plugin, so `*.spec.ts` files in Vue packages get no test-lint rules regardless.
  Factor the `vitestConfig` block into `lib/` and include it from both the node
  and vue configs.
- **Stale coverage excludes.**
  [`src/vitest/node.ts`](./src/vitest/node.ts) excludes `src/types/*` and
  `src/configs/*` — neither path exists in this repo (template leftovers).
  Drop or correct them.

## C. Inconsistencies worth unifying

- **`ignores` differ** between [`src/eslint/node.ts`](./src/eslint/node.ts) and
  [`src/eslint/vue.ts`](./src/eslint/vue.ts) (vue adds `.nuxt`/`.output`/`types`).
  Extract a single shared `ignores` into `lib/`.
- **Two different TS-parser strategies.** `node.ts` uses
  `project: ["./tsconfig.json"]` + `tsconfigRootDir: process.cwd()`; `vue.ts`
  uses the modern `projectService: true`. Standardize on `projectService`.
- **`explicit-function-return-type`** is turned off in the node config only, not
  the vue config.
