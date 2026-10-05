# 📦 @monorepo/configs

Shared ESLint, Vitest, Playwright and TypeScript configuration for the workspace. It centralizes rules and
presets so projects stay consistent without copying configuration.

Only the ESLint half reaches all of them. This package has no `vitest.config.ts` at all, and two
projects extend no tsconfig preset: `packages/ui` is a solution
file whose `tsconfig.app.json` extends `@vue/tsconfig`, and `apps/huella-legal` only references the four
`.nuxt/tsconfig.*.json` Nuxt generates. Both are the framework's own layout rather than drift — but
worth knowing, because a compiler option added here does not reach either one.

Shipped as raw TypeScript, and tagged `type:config`: it depends on nothing in the workspace, and
everything is allowed to depend on it.

## 🚀 Usage

**ESLint** — `eslint.config.ts`:

```ts
import { eslint } from "@monorepo/configs";

export default eslint.createNodeConfig();  // or createVueConfig() / createNuxtConfig()
```

**Vitest** — `vitest.config.ts`:

```ts
import { vitest } from "@monorepo/configs";

export default vitest.createNodeConfig();  // or createVueConfig(viteConfig)
```

`createVueConfig` takes the project's own Vite config and merges into it, so the component
compilation your build already does is the same compilation the tests get. It also swaps in
happy-dom. Both presets report coverage in `text`, `html`, `clover`, `json`, `json-summary` and
`lcov`, and each format has a named consumer: the terminal, a human, external tooling, the merge in
[`@monorepo/scripts`](../../infrastructure/scripts/src/coverage-report/README.md) — which reads
`coverage-final.json` — and [`@monorepo/developer-portal`](../../apps/developer-portal/README.md), which reads
`coverage-summary.json` and nothing else.

Coverage is collected on `test:coverage`, a separate script from `test`, so the pre-push hook and CI's
default run stay on the fast, uninstrumented path. A consuming project needs `@vitest/coverage-v8`
in its own `devDependencies` (`catalog:`) — the provider is a peer of `vitest`, not a transitive
dependency of this package. Both presets also declare an explicit `include`: v8 otherwise only
instruments files a test actually imported, so an untested file would vanish from the report instead
of counting as 0%.

Both presets also carry one `globalSetup`,
[`prepareNuxt.mjs`](./src/vitest/prepareNuxt.mjs): in a project with a `nuxt.config.ts` and no
`.nuxt`, it runs `nuxi prepare` before anything is transformed, because a Nuxt app's `tsconfig.json` is
`files: []` plus references into that directory and every file fails to load while it's missing. It
returns immediately everywhere else, so no project has to opt in or out. It is the one `.mjs` file
here, and has to be: a `.ts` setup file is transformed by the pipeline it exists to repair.

**Vitest for a Nuxt app** — `vitest.config.ts`:

```ts
export default vitest.createNuxtConfig({ root: import.meta.dirname, thresholds: { lines: 90 } });
```

Two projects: `node` for `server/`, `shared/` and `tools/`, and `nuxt` for `app/`, booted through
`@nuxt/test-utils` on happy-dom. Both also cover the same directories inside each `layers/*`, which
Nuxt auto-registers, and the layers' sources count towards coverage. The options are only what differs per app:

| Option | What it does |
| --- | --- |
| `root` | The app root, `import.meta.dirname` |
| `nodeSpecs` | Specs under `app/` that need no Nuxt runtime; they move to the `node` project |
| `setupFiles` | Setup files for the `nuxt` project only, run after the Nuxt entry registers its boot but before it runs |
| `coverageExclude` | Paths kept out of the denominator |
| `thresholds` | Vitest's coverage thresholds. They only bite on a `--coverage` run |

- **Coverage is set on the root config**, because Vitest ignores a coverage block on a project.
- **`@nuxt/test-utils` is resolved from the app, not from here**, so the config half runs the same
  copy the app's specs import from `@nuxt/test-utils/runtime`. The app installs it along with
  `@vue/test-utils` and `happy-dom`.
- **The test boot builds into `node_modules/.cache/nuxt-vitest`, never the app's `.nuxt`.** Nx
  loads every `vitest.config.ts` to build its project graph, so this boot runs before any task,
  including `build`. Booting into `.nuxt` left it half-written, with no `tsconfig.*.json`, and
  `nuxt build`'s typecheck then failed on the app's `tsconfig.json` references (`TS5083`).
- **Nuxt boots with `JITI_MODULE_CACHE=0`.** With jiti's module cache on, a TypeScript Nuxt module
  that installs `@nuxtjs/i18n` (as `@monorepo/i18n/nuxt` does) throws Node's
  `ERR_INTERNAL_ASSERTION` as an unhandled rejection. `nuxi` logs it and carries on, but Vitest and
  Nx's plugin worker both die, and the worker loads every `vitest.config.ts` to infer targets, so
  one broken config stops every `nx` command. The variable is restored once Nuxt has booted.

**Playwright** — `playwright.config.ts`:

```ts
import { playwright } from "@monorepo/configs";

export default playwright.createConfig({ port: 4310, command: "node .output/server/index.mjs", env: { … } });
```

Chromium at 390, 768 and 1280 px, one project per width. Specs live in `e2e/`, output in
`.playwright/`, and screenshot baselines in `e2e/__screenshots__/<spec>/<width>/`. The path has no
platform segment, because baselines are only written in CI's pinned Playwright image:
`ignoreSnapshots` is on whenever `CI` isn't set. The factory returns a plain object and only
imports `@playwright/test`'s types, so the runner's own copy is the only one ever loaded. The app
installs `@playwright/test` at exactly the version in CI's image tag.

**TypeScript** — `tsconfig.json`:

```json
{
    "extends": "@monorepo/configs/tsconfig/node.json",
    "include": ["src", "eslint.config.ts"]
}
```

`base.json` is strict, `ES2022` with ESNext modules, bundler-resolved and `noEmit` — no project here
emits its own JS. It adds `noUncheckedIndexedAccess` on top of `strict`, which does not imply it:
`arr[0]` and `match[1]` are typed `T | undefined`, so a guard on them reads as necessary rather than
as dead code — see [`0013`](../../docs/decisions/0013-linter-coverage.md) for why the two travel
together. `node.json` adds `types: ["node"]` on top, and is what every consumer actually
extends; no consumer extends `base.json` directly, since the config file in the `include` needs
Node types even in a package that otherwise doesn't.

## 🧰 What the ESLint factories bundle

- `@eslint/js` + `typescript-eslint` — type-checked for node and vue, non-type-checked for nuxt
  (Nuxt's generated files make a type-aware pass more trouble than it's worth)
- `eslint-plugin-vue` (strongly-recommended) for the Vue configs
- `@stylistic` formatting: 4-space indent, semicolons, double quotes, always-parenthesised arrow
  params
- `eslint-plugin-jsonc` key sorting for `**/projects/*/*.json`, so the TMS locale files in
  [`infrastructure/translations`](../../infrastructure/translations) stay diffable. The glob matches
  that layout — `projects/<project>/<locale>.json` — not a `locales/` directory
- `@vitest/eslint-plugin` for `**/*.spec.ts`
- `eslint-plugin-regexp` (`flat/recommended`) — ESLint core does not read inside a regex literal, and
  this repo parses markdown, commit subjects and command output with them. It catches super-linear
  backtracking, dead alternatives and unread capturing groups; [`0013`](../../docs/decisions/0013-linter-coverage.md)
  has the sweep
- `@nx/enforce-module-boundaries` — the layering rules. [`lib/boundaries.ts`](./src/eslint/lib/boundaries.ts)
  is the enforced copy; the readable one is the tag table in the
  [root README](../../README.md#-architecture--boundaries). Change both, or they drift
- `no-restricted-imports` under `**/src/core/**`, from
  [`lib/coreIsolation.ts`](./src/eslint/lib/coreIsolation.ts) — the framework-agnostic half of a
  package may not import `@nuxt/*`, `@nuxtjs/*`, `nitropack`, `h3` or `#nuxt/*`. That invariant is
  stated in the `content` and `i18n` AGENTS.md files, and the tag rule above cannot reach it: it
  reasons about project-to-project edges, never subpaths inside one project
- `no-restricted-imports` under Nuxt `app/` and `server/`, from
  [`lib/layerIsolation.ts`](./src/eslint/lib/layerIsolation.ts) — neither layer may import the
  Node-only `tools/` tree, keeping collection commands out of browser and server bundles
- `no-restricted-syntax` under `**/*.ts` and `**/*.vue`, from
  [`lib/constTables.ts`](./src/eslint/lib/constTables.ts) — a module-scope lookup table keyed by a
  closed union is `UPPER_SNAKE = { … } as const satisfies Record<K, V>`, never annotated: the
  annotation widens the values and `Partial` makes every lookup `| undefined`. `Record<string, …>`
  and `Record<number, …>` are left alone, since those tables are indexed by keys nobody can list
- `no-restricted-syntax` under `**/*.vue`, from [`lib/propsInterface.ts`](./src/eslint/lib/propsInterface.ts) — Vue
  configs only. `defineProps` takes a type reference named `Props`, and `Props` is declared with
  `interface`. No plugin rule covers this; `vue/define-props-declaration` only picks type-based over
  runtime, and an inline literal satisfies it. Runtime `defineProps({…})` is left alone. Both sets of
  selectors reach ESLint through [`lib/restrictedSyntax.ts`](./src/eslint/lib/restrictedSyntax.ts), the
  rule's only config
- `vue/no-restricted-syntax` under `**/*.vue`, from [`lib/templateI18n.ts`](./src/eslint/lib/templateI18n.ts) —
  Vue configs only. A `<template>` translates with the global `$t` (and `$te`, `$tm`, `$rt`, `$d`,
  `$n`), never the `t` from `useI18n()`, so a template-only component needs no `useI18n()` call.
  `<script>` is untouched, since `useHead` and friends still need `t`. `$t` reads global messages
  only, so a component with `useScope: "local"` needs a disable comment
- `monorepo/no-template-call` under `**/*.vue`, from [`lib/templateCalls.ts`](./src/eslint/lib/templateCalls.ts) —
  Vue configs only. A template call that reads nothing but component state belongs in a `computed`,
  which caches it instead of re-running it on every render. Calls on a `$` global, inside a `v-on`
  handler, or reading a `v-for` or slot variable are allowed, since a `computed` cannot take the row
  as an argument. Only the outermost offending call in an expression is reported. No plugin rule
  covers this, and `vue/no-restricted-syntax` can't express the variable check, so it is a local
  rule under an inline `monorepo` plugin. `apps/huella-legal` turns it off for its `/lab` studies
- `vue/v-bind-style` with `sameNameShorthand: "always"`, in [`vue.ts`](./src/eslint/vue.ts) — a binding whose
  name and value match is written `:id`, never `:id="id"`. `--fix` rewrites it
- `vue/prefer-separate-static-class`, in [`vue.ts`](./src/eslint/vue.ts) — a class that never
  changes goes in the static `class` attribute, never as a string literal inside `:class`.
  Conditional expressions are left alone, and `--fix` moves the rest
- `@typescript-eslint/consistent-type-definitions: interface`, in [`node.ts`](./src/eslint/node.ts) and [`vue.ts`](./src/eslint/vue.ts) —
  a plain object shape is an `interface`, never `type X = { … }`. Unions, intersections and mapped types stay
  `type`, and `--fix` rewrites the rest

The shared pieces live in [`src/eslint/lib`](./src/eslint/lib) and are composed by
[`node.ts`](./src/eslint/node.ts) and [`vue.ts`](./src/eslint/vue.ts). If you're adding a rule for
everyone, it goes in `lib`; if it's for one flavour, it goes in the factory.
