# 📦 @monorepo/external

The public-facing Nuxt 4 app. It composes the shared packages (`@monorepo/ui`, `@monorepo/i18n`,
`@monorepo/observability`) and keeps its own feature code in [layers](#-layers).

## 🚀 Development

```sh
pnpm exec nx serve @monorepo/external   # from anywhere in the workspace
pnpm dev                                # or from this directory
```

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build (output in `.output/`) |
| `pnpm preview` | Preview the production build |
| `pnpm lint` / `pnpm typecheck` | Quality checks |

## 🔑 Environment

Translations are fetched at runtime, so the app is **not usable without these** — an unset vendor
fails on the first translation request with a `500` naming what is missing.

| Variable | What it is |
| --- | --- |
| `TRANSLATIONS_VENDOR_PROJECT` | The project ID in the TMS |
| `TRANSLATIONS_VENDOR_BASE_URL` | The TMS API base URL (absolute, with scheme) |
| `TRANSLATIONS_VENDOR_OPTIONS_TOKEN` | The TMS API key |
| `NUXT_PUBLIC_OBSERVABILITY_URL` | Faro collector URL. Leave unset and telemetry stays off |

Nothing here has a default in `nuxt.config.ts`, and no real URL or key belongs in the repo. The
three `TRANSLATIONS_*` vars are read at build time but overridable per deployment with the
`NUXT_`-prefixed form (`NUXT_TRANSLATIONS_VENDOR_BASE_URL`, …), since they live in `runtimeConfig`.

## 🌍 i18n

Two blocks in [`nuxt.config.ts`](./nuxt.config.ts) drive it: `i18n` declares the locales
(`en-GB`, `es-ES`, defaulting to `en-GB`) and `translations.vendor` picks where the messages come
from. The `@monorepo/i18n/nuxt` module does the rest — installs `@nuxtjs/i18n`, registers a loader
per locale, and mounts a cached `/api/translations/:locale` route so the TMS base URL and token
never reach the browser.

The vendor is `tolgee`. To work offline instead, point it at the mock TMS in
[`infrastructure/translations`](../../infrastructure/translations): start it with `pnpm docker:up`,
then switch `translations.vendor` to `{ name: "internal", project: "external", baseURL:
"http://localhost:4000" }` — `internal` takes no token. That directory holds the hand-editable
locale JSON for the `external` project.

See the [module README](../../packages/i18n/src/nuxt/README.md) for the options and the gotchas.

## 🧩 Layers

Feature code lives in Nuxt layers under [`layers/`](./layers), one directory per domain, each with
its own README. Nuxt auto-registers them — there is no `extends` to maintain.

- [`layers/user`](./layers/user) — the current user, their role, and the feature flags derived from it

The app shell itself (`app/`) stays thin: a layout, an entry page, an error page, and two client
plugins (Faro telemetry, and a dev-only console filter for a known Nuxt/Vue warning).

## 🗒️ Notes

- **Telemetry is browser-only** and skipped entirely when `NUXT_PUBLIC_OBSERVABILITY_URL` is unset,
  which is why local dev never ships data. `app.version` defaults to `0.0.0`; set
  `NUXT_PUBLIC_OBSERVABILITY_APP_VERSION` at deploy time or the data can't be attributed to a release.
- **Typechecking runs on build** (`typescript.typeCheck: "build"`), so `pnpm build` is slower than a
  plain Nuxt build and catches what `pnpm typecheck` would.
