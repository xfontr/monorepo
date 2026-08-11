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

All of it comes from the `translations` block in [`nuxt.config.ts`](./nuxt.config.ts), handled
by the `@budget-forecast/i18n/nuxt` module: it installs and configures `@nuxtjs/i18n`, registers
the locale loader, and mounts the cached `/api/translations/:locale` route that proxies the TMS.

Default locale is the first entry (`en-EN`); browser detection is disabled. Point `TMS_BASE_URL`
at a running [`infrastructure/translations`](../../infrastructure/translations) server, or set
`NUXT_TRANSLATIONS_TMS_BASE_URL` at deploy time. See the
[package README](../../packages/i18n/README.md) for the options.
