# 🧩 lib

Every file here is one ESLint concern, exported as a config object that [`node.ts`](../node.ts) and
[`vue.ts`](../vue.ts) spread into a project's config array. A rule belongs in this folder when it
applies to **every** project the package touches; a rule for one flavour goes in the factory that
composes it instead — see the [package README](../../../README.md#-what-the-eslint-factories-bundle).
The exceptions are `constTables.ts` and `propsInterface.ts`, which export selectors for
[`restrictedSyntax.ts`](./restrictedSyntax.ts) to compose into one config.

## 🗂 What's here

| File | What it configures |
| --- | --- |
| [`index.ts`](./index.ts) | The barrel every factory imports through. A plugin preset that needs no local customization is composed straight here instead of getting its own file |
| [`boundaries.ts`](./boundaries.ts) | `@nx/enforce-module-boundaries` and the `depConstraints` table — the enforced copy of the Nx tag table; the readable one is the [root README](../../../../../README.md#-architecture--boundaries) |
| [`coreIsolation.ts`](./coreIsolation.ts) | `no-restricted-imports` under `**/src/core/**`, keeping the framework-agnostic half of `content`/`i18n` free of the Nuxt and Nitro runtime — the list is in the [package README](../../../README.md#-what-the-eslint-factories-bundle) |
| [`layerIsolation.ts`](./layerIsolation.ts) | `no-restricted-imports` under `app/` and `server/`, keeping Nuxt's browser-facing layers free of the Node-only `tools/` layer |
| [`restrictedSyntax.ts`](./restrictedSyntax.ts) | The only owner of `no-restricted-syntax`: `restrictedSyntax` for `**/*.ts` and `restrictedSyntaxVue` for `**/*.vue` (Vue configs only). One owner, because a second config setting the rule for the same files replaces the first one's selectors instead of adding to them |
| [`constTables.ts`](./constTables.ts) | Selectors, not a config: a module-scope lookup table keyed by a closed union is `UPPER_SNAKE = { … } as const satisfies Record<K, V>` — never annotated, never `Partial`. `Record<string, …>` and `Record<number, …>` are left alone |
| [`propsInterface.ts`](./propsInterface.ts) | Selectors, not a config: `defineProps<Props>()` with `Props` declared as a separate `interface` rather than an inline type literal, and no optional prop defaulted to `undefined`. `.vue` only |
| [`templateI18n.ts`](./templateI18n.ts) | `vue/no-restricted-syntax` under `**/*.vue`, requiring the global `$t`/`$te`/`$tm`/`$rt`/`$d`/`$n` inside `<template>` instead of the `useI18n()` binding. Vue configs only |
| [`templateCalls.ts`](./templateCalls.ts) | `monorepo/no-template-call` under `**/*.vue`, a local rule that moves template calls reading only component state into a `computed`. `$` globals, `v-on` handlers and calls on `v-for`/slot variables pass. Vue configs only |
| [`arrowFunctions.ts`](./arrowFunctions.ts) | `prefer-arrow-functions/prefer-arrow-functions` and core `prefer-arrow-callback` for scripts and `**/*.vue`, so `--fix` turns every `function` an arrow can replace into one |
| [`ignores.ts`](./ignores.ts) | `baseIgnores` — the glob list every factory feeds into ESLint's `ignores` |
| [`jsonc.ts`](./jsonc.ts) | `eslint-plugin-jsonc`'s `sort-keys`, scoped to `**/projects/*/*.json` so the TMS locale files stay diffable |
| [`format.ts`](./format.ts) | `format/prettier` with the Prettier options inline: `format` for scripts, `formatVue` for `**/*.vue` (Vue configs only), which also turns off every `vue/*` rule of type `layout` |
| [`vitest.ts`](./vitest.ts) | `@vitest/eslint-plugin`'s `recommended` rules, globals and `typecheck: true`, scoped to `**/*.spec.ts` |

## 🚫 What doesn't belong here

A file earns its place by **customizing** a plugin's config — a `files` glob, a merged or
overridden rule, a `settings` block — or by defining a rule no plugin ships, as `templateCalls.ts`
does. A plugin preset used exactly as the plugin ships it has nothing
to customize, so it doesn't need a file to hide that fact in: import the plugin and assign its
preset to a const directly in [`index.ts`](./index.ts). The moment it needs a glob or an override,
it graduates into its own file, same as everything else here.
