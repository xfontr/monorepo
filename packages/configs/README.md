# 📦 @monorepo/configs

The ESLint, Vitest and TypeScript setup for the workspace, in one place. A project keeps a config
file of its own, but that file is a one-liner calling a factory from here — so a rule change lands
everywhere at once instead of drifting across a copy per project.

Only the ESLint half reaches all of them. `apps/huella-legal` and this package have no
`vitest.config.ts` at all, and two projects extend no tsconfig preset: `packages/ui` is a solution
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
`coverage-final.json` — and [`@monorepo/dashboard`](../../apps/dashboard/README.md), which reads
`coverage-summary.json` and nothing else.

Coverage is collected on `test:coverage`, a separate script from `test`, so the pre-push hook and CI's
default run stay on the fast, uninstrumented path. A consuming project needs `@vitest/coverage-v8`
in its own `devDependencies` (`catalog:`) — the provider is a peer of `vitest`, not a transitive
dependency of this package. Both presets also declare an explicit `include`: v8 otherwise only
instruments files a test actually imported, so an untested file would vanish from the report instead
of counting as 0%.

**TypeScript** — `tsconfig.json`:

```json
{
    "extends": "@monorepo/configs/tsconfig/node.json",
    "include": ["src", "eslint.config.ts"]
}
```

`base.json` is strict, `ES2022` with ESNext modules, bundler-resolved and `noEmit` — no project here
emits its own JS. `node.json` adds `types: ["node"]` on top, and is what every consumer actually
extends; nothing extends `base.json` directly, since the config file in the `include` needs Node
types even in a package that otherwise doesn't.

## 📐 What the ESLint factories bundle

- `@eslint/js` + `typescript-eslint` — type-checked for node and vue, non-type-checked for nuxt
  (Nuxt's generated files make a type-aware pass more trouble than it's worth)
- `eslint-plugin-vue` (strongly-recommended) for the Vue configs
- `@stylistic` formatting: 4-space indent, semicolons, double quotes, always-parenthesised arrow
  params
- `eslint-plugin-jsonc` key sorting for `**/projects/*/*.json`, so the TMS locale files in
  [`infrastructure/translations`](../../infrastructure/translations) stay diffable. The glob matches
  that layout — `projects/<project>/<locale>.json` — not a `locales/` directory
- `@vitest/eslint-plugin` for `**/*.spec.ts`
- `@nx/enforce-module-boundaries` — the layering rules. [`lib/boundaries.ts`](./src/eslint/lib/boundaries.ts)
  is the enforced copy; the readable one is the tag table in the
  [root README](../../README.md#-architecture--boundaries). Change both, or they drift
- `no-restricted-imports` under `**/src/core/**`, from
  [`lib/coreIsolation.ts`](./src/eslint/lib/coreIsolation.ts) — the framework-agnostic half of a
  package may not import `@nuxt/*`, `@nuxtjs/*`, `nitropack`, `h3` or `#nuxt/*`. That invariant is
  stated in the `content` and `i18n` CLAUDE.md files, and the tag rule above cannot reach it: it
  reasons about project-to-project edges, never subpaths inside one project

The shared pieces live in [`src/eslint/lib`](./src/eslint/lib) and are composed by
[`node.ts`](./src/eslint/node.ts) and [`vue.ts`](./src/eslint/vue.ts). If you're adding a rule for
everyone, it goes in `lib`; if it's for one flavour, it goes in the factory.
