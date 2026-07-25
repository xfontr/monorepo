# 📦 @budget-forecast/ui

Shared Vue 3 component library. Exports raw `.vue`/`.ts` source (no build step) — the consuming app compiles it.

## 🚀 Usage

```ts
import { Button } from "@budget-forecast/ui";
```

## 🛠️ Development

- Components live in `lib/components`, exported from `lib/index.ts`.
- The `@/` alias maps to `lib/` (both in `tsconfig.app.json` and `vite.config.ts`).
- Tests sit next to components as `*.spec.ts` (`@vue/test-utils` + happy-dom).

| Command | What it does |
| --- | --- |
| `pnpm test` | Run unit tests once |
| `pnpm typecheck` | `vue-tsc --build` |
| `pnpm lint` | ESLint (Vue config from `@budget-forecast/configs`) |
