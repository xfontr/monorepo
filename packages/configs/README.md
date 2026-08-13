# 📦 @monorepo/configs

Shared tooling presets for the whole workspace: ESLint flat configs, Vitest configs and tsconfig bases. Exported as raw TypeScript source; each project consumes it through a thin wrapper file.

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

**TypeScript** — `tsconfig.json`:

```json
{
    "extends": "@monorepo/configs/tsconfig/base.json",
    "include": ["src"]
}
```

Use `tsconfig/node.json` instead of `base.json` when the package needs Node types.

## 📐 What the ESLint factories bundle

- `@eslint/js` + `typescript-eslint` (type-checked for node/vue, non-type-checked for nuxt)
- `eslint-plugin-vue` (strongly-recommended) for Vue configs
- `@stylistic` formatting rules: 4-space indent, semicolons, double quotes
- `eslint-plugin-jsonc` key sorting for `**/locales/*.json`
- `@vitest/eslint-plugin` for `**/*.spec.ts`
- `@nx/enforce-module-boundaries` layering rules (see root README)
