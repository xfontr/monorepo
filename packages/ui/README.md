# 📦 @monorepo/ui

The shared Vue 3 component library. It ships raw `.vue`/`.ts` source with no build step — the
consuming app compiles it, so there is nothing to rebuild while you work on a component.

```ts
import { Button } from "@monorepo/ui";
```

## 🛠️ Development

Components live in [`lib/components`](./lib/components) and are re-exported from
[`lib/index.ts`](./lib/index.ts) — a component that isn't listed there doesn't exist as far as
consumers are concerned. Each one sits next to its `*.spec.ts` and its `*.stories.ts`.

| Command | What it does |
| --- | --- |
| `pnpm storybook` | Storybook on port 6006 — the fastest way to work on a component |
| `pnpm test` | Unit tests once (`@vue/test-utils` + happy-dom) |
| `pnpm typecheck` | `vue-tsc --build` |
| `pnpm lint` | ESLint (Vue config from `@monorepo/configs`) |
| `pnpm build-storybook` | Static Storybook build, for publishing it somewhere |

The `@/` alias points at `lib/`. It's declared twice — in
[`tsconfig.app.json`](./tsconfig.app.json) for the editor and in [`vite.config.ts`](./vite.config.ts)
for the bundler — so if an import resolves in one and not the other, that's the pair to check.

## 📐 Boundaries

Tagged `type:ui`, which may only depend on other `type:ui` projects and on `@monorepo/configs`.
That is what keeps it a component library: no store, no data fetching, no translations. Anything
that needs those belongs in an app layer instead.

Right now the library is one placeholder `Button`.
