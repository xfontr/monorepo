# 🧩 lib

Every file here is one ESLint concern, exported as a config object. [`index.ts`](./index.ts) lists
them in two arrays: `shared`, which [`node.ts`](../node.ts) and [`vue.ts`](../vue.ts) both spread,
and `vueOnly`, which only `vue.ts` adds. A rule belongs in this folder when it
applies to **every** project the package touches; a rule for one flavour goes in the factory that
composes it instead — see the [package README](../../../README.md#-what-the-eslint-factories-bundle).
`routeMeta.ts`, `tailwind.ts` and `layerBoundaries.ts` are composed by no factory: a project opts in
by appending `eslint.routeMeta`, `eslint.tailwind(entryPoint)` or `eslint.layerBoundaries({ cores, kit })`
after its factory.

A rule no plugin ships lives in [`../rules`](../rules) as a `monorepo/<name>` rule with a
`RuleTester` spec beside it, and a file here switches it on. Every file registers the same plugin
object from [`rules/index.ts`](../rules/index.ts): ESLint throws `Cannot redefine plugin` when two
different objects under one name meet on a file.

## 🗂 What's here

| File | What it configures |
| --- | --- |
| [`index.ts`](./index.ts) | The `shared` and `vueOnly` lists the factories spread, in order. A plugin preset that needs no local customization is composed straight here instead of getting its own file |
| [`boundaries.ts`](./boundaries.ts) | `@nx/enforce-module-boundaries` and the `depConstraints` table — the enforced copy of the Nx tag table; the readable one is the [root README](../../../../../README.md#-architecture--boundaries) |
| [`coreIsolation.ts`](./coreIsolation.ts) | `no-restricted-imports` under `**/src/core/**`, keeping the framework-agnostic half of `content`/`i18n` free of the Nuxt and Nitro runtime — the list is in the [package README](../../../README.md#-what-the-eslint-factories-bundle) |
| [`layerIsolation.ts`](./layerIsolation.ts) | `no-restricted-imports` under `app/` and `server/`, keeping Nuxt's browser-facing layers free of the Node-only `tools/` layer |
| [`constTables.ts`](./constTables.ts) | `monorepo/lookup-table-shape`: `constTables` for `**/*.ts` and `constTablesVue` for `**/*.vue` (Vue configs only). A module-scope lookup table keyed by a closed union is `UPPER_SNAKE = { … } as const satisfies Record<K, V>` — never annotated, never `Partial`. `Record<string, …>` and `Record<number, …>` are left alone |
| [`propsInterface.ts`](./propsInterface.ts) | `monorepo/props-shape` under `**/*.vue`: `defineProps<Props>()` with `Props` declared as a separate `interface` rather than an inline type literal, and no optional prop defaulted to `undefined`. Vue configs only |
| [`templateI18n.ts`](./templateI18n.ts) | `monorepo/template-global-i18n` under `**/*.vue`, requiring the global `$t`/`$te`/`$tm`/`$rt`/`$d`/`$n` inside `<template>` instead of the `useI18n()` binding. Vue configs only |
| [`templateCalls.ts`](./templateCalls.ts) | `monorepo/no-template-call` under `**/*.vue`, moving template calls that read only component state into a `computed`. `$` globals, `v-on` handlers and calls on `v-for`/slot variables pass. Vue configs only |
| [`arrowFunctions.ts`](./arrowFunctions.ts) | `prefer-arrow-functions/prefer-arrow-functions` and core `prefer-arrow-callback` for scripts and `**/*.vue`, so `--fix` turns every `function` an arrow can replace into one |
| [`destructuring.ts`](./destructuring.ts) | Core `prefer-destructuring` for scripts and `**/*.vue`, on variable declarations and objects only — array access and assignments are exempt |
| [`typeDefinitions.ts`](./typeDefinitions.ts) | `@typescript-eslint/consistent-type-definitions: interface`: `typeDefinitions` for `**/*.ts` and `typeDefinitionsVue` for `**/*.vue` (Vue configs only) |
| [`useBeforeDefine.ts`](./useBeforeDefine.ts) | `@typescript-eslint/no-use-before-define`, types exempt: `useBeforeDefine` for `**/*.ts` and `useBeforeDefineVue` for `**/*.vue` (Vue configs only), so every module declares a helper above the code that calls it |
| [`regexp.ts`](./regexp.ts) | `eslint-plugin-regexp`'s `flat/recommended` plus `regexp/no-super-linear-move`, which the preset leaves off and which is the shape of every quadratic regex SonarCloud has reported here |
| [`awaitInLoop.ts`](./awaitInLoop.ts) | Core `no-await-in-loop` everywhere but specs. Independent awaits go through `Promise.all`; a loop that must stay sequential carries a block disable saying why |
| [`ternaries.ts`](./ternaries.ts) | Core `no-nested-ternary` everywhere but specs |
| [`sortCompare.ts`](./sortCompare.ts) | `@typescript-eslint/require-array-sort-compare` with string arrays included, for `.ts` outside specs, stories and `.storybook/` — the files every flavour type-checks |
| [`ignores.ts`](./ignores.ts) | `baseIgnores` — the glob list every factory feeds into ESLint's `ignores` |
| [`jsonc.ts`](./jsonc.ts) | `eslint-plugin-jsonc`'s `sort-keys`, scoped to `**/projects/*/*.json` so the TMS locale files stay diffable |
| [`format.ts`](./format.ts) | `format/prettier` with the Prettier options inline: `format` for scripts, `formatVue` for `**/*.vue` (Vue configs only), which also turns off every `vue/*` rule of type `layout` |
| [`console.ts`](./console.ts) | `noConsole`: `no-console` at `error` for everything but `**/*.spec.ts`, where the Vitest console guard takes over |
| [`unsafeCode.ts`](./unsafeCode.ts) | `unsafeCode`: core `no-eval`, `no-implied-eval`, `no-new-func`, `no-script-url` and a `no-restricted-properties` ban on the raw-HTML sinks, everywhere but specs. `unsafeCodeVue`: `vue/no-v-html` under `**/*.vue` (Vue configs only) |
| [`e2eFixture.ts`](./e2eFixture.ts) | `no-restricted-imports` of `test` from `@playwright/test` in `**/e2e/**/*.spec.ts`, so every Playwright spec goes through `@monorepo/configs/playwright/test` and its console guard |
| [`disableReasons.ts`](./disableReasons.ts) | `monorepo/disable-needs-reason` and `reportUnusedDisableDirectives: "error"`: `disableReasons` for scripts and `disableReasonsVue` for `**/*.vue` (Vue configs only). Every `eslint-disable` names its rules and ends in `-- <why>`, a block disable is closed, and a disable that hides nothing fails |
| [`defaultExports.ts`](./defaultExports.ts) | `monorepo/named-default-export`: `defaultExports` for scripts and `defaultExportsVue` for `**/*.vue` (Vue configs only). A default-exported function or class has a name; calls and literals are left alone |
| [`routeMeta.ts`](./routeMeta.ts) | `monorepo/require-route-meta` under `server/api/` and `server/routes/`: a top-level `defineRouteMeta` whose `openAPI` object literal has `tags` and `summary`, placed after the `export default` handler. Opt-in, for a Nitro app with `experimental.openAPI` on |
| [`layerBoundaries.ts`](./layerBoundaries.ts) | `monorepo/layer-boundaries` under `layers/` and the `kit` paths: the kit uses only itself, a core only itself and the kit, a feature also the cores and never another feature, and no layer anything else outside `layers/`, written or auto-imported. A feature's `app/pages/` may still render another feature's components. Every layer not named in `cores` is a feature. Opt-in, for a Nuxt app split into layers |
| [`tailwind.ts`](./tailwind.ts) | `eslint-plugin-better-tailwindcss`'s `recommended-error` rules under `**/*.vue` and `**/*.ts`, minus `enforce-consistent-line-wrapping`, which fights Prettier. Opt-in: a project with Tailwind spreads `eslint.tailwind(entryPoint)`, naming its CSS entry point |
| [`vitest.ts`](./vitest.ts) | `@vitest/eslint-plugin`'s `recommended` rules, globals and `typecheck: true`, scoped to `**/*.spec.ts` |

## 🚫 What doesn't belong here

A file earns its place by **customizing** a plugin's config — a `files` glob, a merged or
overridden rule, a `settings` block — or by switching on a rule from [`../rules`](../rules), as
`templateCalls.ts` does. A plugin preset used exactly as the plugin ships it has nothing
to customize, so it doesn't need a file to hide that fact in: import the plugin and assign its
preset to a const directly in [`index.ts`](./index.ts). The moment it needs a glob or an override,
it graduates into its own file, same as everything else here.
