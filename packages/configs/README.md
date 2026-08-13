# 📦 @monorepo/configs

Every project's ESLint, Vitest and TypeScript setup, in one place. Each project keeps a config file
of its own, but that file is a one-liner that calls a factory from here — so a rule change lands
everywhere at once instead of drifting across eight copies.

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
happy-dom. Both presets report coverage in `text`, `html`, `clover`, `json` and `lcov` — the wide
spread is there so external coverage tooling can pick a format it understands.

**TypeScript** — `tsconfig.json`:

```json
{
    "extends": "@monorepo/configs/tsconfig/base.json",
    "include": ["src"]
}
```

`base.json` is strict, ESNext, bundler-resolved and `noEmit` — no project here emits its own JS.
Use `tsconfig/node.json` instead when the package needs Node types.

## 📐 What the ESLint factories bundle

- `@eslint/js` + `typescript-eslint` — type-checked for node and vue, non-type-checked for nuxt
  (Nuxt's generated files make a type-aware pass more trouble than it's worth)
- `eslint-plugin-vue` (strongly-recommended) for the Vue configs
- `@stylistic` formatting: 4-space indent, semicolons, double quotes
- `eslint-plugin-jsonc` key sorting for `**/locales/*.json`, so translation files stay diffable
- `@vitest/eslint-plugin` for `**/*.spec.ts`
- `@nx/enforce-module-boundaries` — the layering rules, listed in the [root README](../../README.md)

The shared pieces live in [`src/eslint/lib`](./src/eslint/lib) and are composed by
[`node.ts`](./src/eslint/node.ts) and [`vue.ts`](./src/eslint/vue.ts). If you're adding a rule for
everyone, it goes in `lib`; if it's for one flavour, it goes in the factory.
