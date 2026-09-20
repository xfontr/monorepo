# 🧩 lib

Every file here is one ESLint concern, exported as a config object that [`node.ts`](../node.ts) and
[`vue.ts`](../vue.ts) spread into a project's config array. A rule belongs in this folder when it
applies to **every** project the package touches; a rule for one flavour goes in the factory that
composes it instead — see the [package README](../../../README.md#-what-the-eslint-factories-bundle).

## 🗂 What's here

| File | What it configures |
| --- | --- |
| [`index.ts`](./index.ts) | The barrel every factory imports through. A plugin preset that needs no local customization is composed straight here instead of getting its own file |
| [`boundaries.ts`](./boundaries.ts) | `@nx/enforce-module-boundaries` and the `depConstraints` table — the enforced copy of the Nx tag table; the readable one is the [root README](../../../../../README.md#-architecture--boundaries) |
| [`coreIsolation.ts`](./coreIsolation.ts) | `no-restricted-imports` under `**/src/core/**`, keeping the framework-agnostic half of `content`/`i18n` free of `@nuxt/*`, `nitropack` and `h3` |
| [`layerIsolation.ts`](./layerIsolation.ts) | `no-restricted-imports` under `app/` and `server/`, keeping Nuxt's browser-facing layers free of the Node-only `tools/` layer |
| [`ignores.ts`](./ignores.ts) | `baseIgnores` — the glob list every factory feeds into ESLint's `ignores` |
| [`jsonc.ts`](./jsonc.ts) | `eslint-plugin-jsonc`'s `sort-keys`, scoped to `**/projects/*/*.json` so the TMS locale files stay diffable |
| [`stylistic.ts`](./stylistic.ts) | `@stylistic/eslint-plugin`'s `recommended` config plus this repo's four formatting calls: 4-space indent, semicolons, double quotes, parenthesised arrow params |
| [`vitest.ts`](./vitest.ts) | `@vitest/eslint-plugin`'s `recommended` rules, globals and `typecheck: true`, scoped to `**/*.spec.ts` |

## 🚫 What doesn't belong here

A file earns its place by **customizing** a plugin's config — a `files` glob, a merged or
overridden rule, a `settings` block. A plugin preset used exactly as the plugin ships it has nothing
to customize, so it doesn't need a file to hide that fact in: import the plugin and assign its
preset to a const directly in [`index.ts`](./index.ts). The moment it needs a glob or an override,
it graduates into its own file, same as everything else here.
