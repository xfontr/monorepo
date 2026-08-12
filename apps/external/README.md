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

Configured by the `translations` and `i18n` blocks in [`nuxt.config.ts`](./nuxt.config.ts) —
`translations.vendor` picks the TMS, `i18n.locales` declares the locales — and handled by the
`@budget-forecast/i18n/nuxt` module: it installs and configures `@nuxtjs/i18n`, registers the
locale loader, and mounts the cached `/api/translations/:locale` route that proxies the TMS.

Point `TMS_BASE_URL` at a running
[`infrastructure/translations`](../../infrastructure/translations) server, or set
`NUXT_TRANSLATIONS_VENDOR_BASE_URL` at deploy time. See the
[module README](../../packages/i18n/src/nuxt/README.md) for the options and gotchas.

`i18n.defaultLocale` is currently unset, so `@nuxtjs/i18n` falls back to its
`prefix_except_default` strategy with no unprefixed locale: pages live at `/en-GB` and `/es-ES`,
and `/` returns a 404.
