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
| `NUXT_PUBLIC_OBSERVABILITY_URL` | Faro collector URL. Leave unset and browser telemetry stays off |
| `NUXT_OBSERVABILITY_URL` | Grafana OTLP gateway URL. Leave unset and server telemetry stays off |
| `NUXT_OBSERVABILITY_INSTANCE_ID` | Grafana Cloud instance ID, the user half of the OTLP credentials |
| `NUXT_OBSERVABILITY_TOKEN` | Grafana Cloud access token, the password half |

Nothing here has a default in `nuxt.config.ts`, and no real URL or key belongs in the repo. The
three `TRANSLATIONS_*` vars are read at build time but overridable per deployment with the
`NUXT_`-prefixed form (`NUXT_TRANSLATIONS_VENDOR_BASE_URL`, …), since they live in `runtimeConfig`.

## 🌍 i18n

Two blocks in [`nuxt.config.ts`](./nuxt.config.ts) drive it: `i18n` declares the locales
(`en-GB`, `es-ES`, defaulting to `en-GB`) and `translations.vendor` picks where the messages come
from. The `@monorepo/i18n/nuxt` module does the rest — installs `@nuxtjs/i18n`, registers a loader
per locale, and mounts a cached `/api/translations/:locale` route so the TMS base URL and token
never reach the browser.

The vendor is currently `tolgee`. The other option is the TMS in
[`infrastructure/translations`](../../infrastructure/translations), which holds the hand-editable
locale JSON for the `external` project: run it with `pnpm docker:up`, then set
`translations.vendor` to `{ name: "internal", project: "external", baseURL: "http://localhost:4000"
}` — `internal` takes no token. Nothing outside that config block changes either way.

See the [module README](../../packages/i18n/src/nuxt/README.md) for the options and the gotchas.

## 🧩 Layers

Feature code lives in Nuxt layers under [`layers/`](./layers), one directory per domain, each with
its own README. Nuxt auto-registers them — there is no `extends` to maintain.

- [`layers/user`](./layers/user) — the current user, their role, and the feature flags derived from it

The app shell itself (`app/`) stays thin: a layout, an entry page, an error page, and two client
plugins (Faro telemetry, and a dev-only console filter for a known Nuxt/Vue warning). Server code
outside the layers is just as thin: one Nitro plugin, for telemetry.

## 📡 Telemetry

Two halves, one per runtime, each from [`@monorepo/observability`](../../packages/observability) and
each skipped entirely when its URL is unset — which is why local dev ships nothing.

| Where | Plugin | Off switch |
| --- | --- | --- |
| Browser | [`app/plugins/observability.client.ts`](./app/plugins/observability.client.ts) | `NUXT_PUBLIC_OBSERVABILITY_URL` |
| Nitro | [`server/plugins/observability.ts`](./server/plugins/observability.ts) | `NUXT_OBSERVABILITY_URL` |

The server plugin opens the request span itself, by wrapping `nitroApp.h3App.handler`. It has to:
Nitro imports `node:http` before any plugin runs, so OpenTelemetry's HTTP instrumentation finds
nothing left to patch and no inbound span ever gets created. Wrapping the handler also means
internal `$fetch` calls nest under the request that made them, and an incoming `traceparent`
continues the browser's trace rather than starting a second one.

Both halves read `app.version` and `app.environment` from the same public runtime config, so one
`NUXT_PUBLIC_OBSERVABILITY_APP_VERSION` stamps browser and server alike. It defaults to `0.0.0` —
set it at deploy time or nothing can be attributed to a release. Static assets (`/_nuxt`, `/_fonts`,
`/favicon.ico`) are left untraced on purpose; the list lives in the plugin.

## 🗒️ Notes

- **Typechecking runs on build** (`typescript.typeCheck: "build"`), so `pnpm build` is slower than a
  plain Nuxt build and catches what `pnpm typecheck` would.
