# 📦 @budget-forecast/external

Public-facing Nuxt 4 app. Presentation layer only — it composes shared packages (`@budget-forecast/ui`, `@budget-forecast/i18n`) and holds no domain logic.

## 🚀 Development

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build (output in `.output/`) |
| `pnpm preview` | Preview the production build |
| `pnpm lint` / `pnpm typecheck` | Quality checks |

## 🌍 i18n

Each locale merges two layers (lazy-loaded by `@nuxtjs/i18n`):

1. **Shared** keys from `@budget-forecast/i18n` (the package exports absolute file paths).
2. **App-local** keys from `i18n/locales/{en,es}.json`.

Default locale is `es`; browser detection is disabled.
