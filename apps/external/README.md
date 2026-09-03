# 📦 @monorepo/external

The public-facing Nuxt 4 app. It composes the shared packages (`@monorepo/ui`, `@monorepo/i18n`,
`@monorepo/content`, `@monorepo/observability`) and keeps its own feature code in
[layers](#-layers).

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
| `pnpm lint` | ESLint — the nuxt flavour, deliberately not type-checked |
| `pnpm typecheck` | `nuxt typecheck`. Redundant before a build: `typescript.typeCheck: "build"` makes `pnpm build` do the same pass, which is why the build is slow |
| `pnpm test` | Vitest, on the node preset. Covers the [Nitro telemetry plugin](#-telemetry) — see [Testing](#-testing) |

Two modules beyond the shared ones are installed here: `@nuxt/fonts`, and `@pinia/nuxt` with
`pinia.storesDirs` widened to `./app/layers/**/app/stores/**`. That second path is load-bearing — a
store inside a layer is not picked up without it, and the failure looks like a missing composable
rather than a missing config.

## 🔑 Environment

Translations and articles are both fetched over the network, so an unset vendor is not a degraded
page but a `500` naming what is missing, on the first request that needs it.

| Variable | What it is |
| --- | --- |
| `NUXT_TRANSLATIONS_VENDOR_PROJECT` | The project ID in the TMS |
| `NUXT_TRANSLATIONS_VENDOR_BASE_URL` | The TMS API base URL (absolute, with scheme) |
| `NUXT_TRANSLATIONS_VENDOR_OPTIONS_TOKEN` | The TMS API key |
| `NUXT_CONTENT_VENDOR_BASE_URL` | The WordPress site root, **without** `/wp-json` — the provider owns that path. Only `/articles` needs it |
| `NUXT_PUBLIC_OBSERVABILITY_URL` | Faro collector URL. Leave unset and browser telemetry stays off |
| `NUXT_PUBLIC_OBSERVABILITY_APP_VERSION` | Stamped on browser *and* server spans. Defaults to `0.0.0`, which nothing can be attributed to — set it at deploy time |
| `NUXT_PUBLIC_OBSERVABILITY_APP_ENVIRONMENT` | Stamped the same way. Defaults to `development` |
| `NUXT_OBSERVABILITY_URL` | Grafana OTLP gateway URL. Leave unset and server telemetry stays off |
| `NUXT_OBSERVABILITY_INSTANCE_ID` | Grafana Cloud instance ID, the user half of the OTLP credentials |
| `NUXT_OBSERVABILITY_TOKEN` | Grafana Cloud access token, the password half |

Nothing here has a default in `nuxt.config.ts`, and no real URL or key belongs in the repo. Every
variable is read at **startup**, not at build time: `nuxt.config.ts` declares the keys empty and Nuxt
fills them from the environment, so one build artifact runs in any environment and no credential is
baked into `.output/`. Nothing reads `process.env` in `nuxt.config.ts` — a value read there is
resolved during the build and freezes the artifact to the host that produced it.

The vendor **names** are the exception, and they are not env vars: `translations.vendor.name` and
`content.vendor.name` select each vendor's config type, so they stay literals in `nuxt.config.ts`.

## 🌍 i18n

Two blocks in [`nuxt.config.ts`](./nuxt.config.ts) drive it: `i18n` declares the locales
(`en-GB`, `es-ES`, defaulting to `en-GB`) and `translations.vendor` picks where the messages come
from. The `@monorepo/i18n/nuxt` module does the rest — installs `@nuxtjs/i18n`, registers a loader
per locale, and mounts a cached `/api/translations/:locale` route so the TMS base URL and token
never reach the browser.

The vendor is currently `tolgee`. The other option is the TMS in
[`infrastructure/translations`](../../infrastructure/translations), which holds the hand-editable
locale JSON for the `external` project: run it with `pnpm docker:up`, set `translations.vendor.name`
to `"internal"` in `nuxt.config.ts`, and point the env at it —
`NUXT_TRANSLATIONS_VENDOR_BASE_URL=http://localhost:4000/` with
`NUXT_TRANSLATIONS_VENDOR_PROJECT=external`. `internal` takes no token. Only `name` is a code change:
it selects the vendor's config type, so it cannot come from the environment.

See the [module README](../../packages/i18n/src/nuxt/README.md) for the options and the gotchas.

## 📄 Content

One block in [`nuxt.config.ts`](./nuxt.config.ts) drives it: `content.vendor` picks the CMS, and the
`@monorepo/content/nuxt` module mounts a cached `/api/content/*` BFF plus an auto-imported
`useContent()`, so the CMS base URL never reaches the browser and a list costs one upstream request.

The vendor is `wordpress`, pointed at an external WordPress install — the CMS is not in this repo, so
`infrastructure/` has nothing to do with it. Two pages consume it, both in `app/` rather than a
layer because they are the shell's own reading surface and carry no domain logic of their own:

| Page | Reads | Notes |
| --- | --- | --- |
| [`app/pages/articles/index.vue`](./app/pages/articles/index.vue) | `listEntries("posts")` | Paginated by `?page`. It does **not** re-validate the page number — the BFF already bounds it and a second copy of those bounds is a second place for them to drift. A `400` from the BFF is turned into a `404`, because a query-parameter complaint is not something a reader should see |
| [`app/pages/articles/[slug].vue`](./app/pages/articles/%5Bslug%5D.vue) | `getEntry("posts", slug)` | No `locale` is passed: the content locale is the vendor's axis and WordPress refuses one outright |

Both `v-html` the entry's `title`, `excerpt` and `body`. That is not an oversight — WordPress renders
every text field to HTML, entities and all, and nothing sanitises it, which is fine only while the
CMS is first-party. See the [package README](../../packages/content/README.md#-deliberately-deferred).

See the [module README](../../packages/content/src/nuxt/README.md) for the options, the cache windows
and the gotchas.

## 🧩 Structure

[`app/`](./app) is the whole front end and stays thin: a layout, an error page, two client plugins
(Faro telemetry, and a dev-only console filter for a known Nuxt/Vue warning), and three pages — an
entry page and the two [article pages](#-content). Server code is just as thin: one Nitro plugin,
for telemetry.

There is no `app/layers/` directory. Every page here is the shell's own reading surface and carries
no domain logic, so splitting them into Nuxt layers would be a directory per feature with nothing in
it. When feature code with real domain logic does land, it goes in a layer under `app/layers/`, one
directory per domain — Nuxt auto-registers them by their presence, so there is no `extends` array to
add and adding one is the mistake. That is the path `pinia.storesDirs` above is already widened for.

## 📡 Telemetry

Two halves, one per runtime, each from [`@monorepo/observability`](../../packages/observability) and
each skipped entirely when its URL is unset — which is why local dev ships nothing.

| Where | Plugin | Off switch |
| --- | --- | --- |
| Browser | [`app/plugins/observability.client.ts`](./app/plugins/observability.client.ts) | `NUXT_PUBLIC_OBSERVABILITY_URL` |
| Nitro | [`server/plugins/observability.ts`](./server/plugins/observability.ts) | `NUXT_OBSERVABILITY_URL` |

The server plugin opens the request span itself, by wrapping `nitroApp.h3App.handler`. It has to:
OpenTelemetry's HTTP instrumentation cannot patch `node:http` here — the build is ESM, which needs a
loader preloaded with `--import`, and Nitro has imported the module before any plugin runs either
way. So the package does not ship that instrumentation at all and no inbound span would exist
without this wrapper. Wrapping the handler also means internal `$fetch` calls nest under the request
that made them, and an incoming `traceparent` continues the browser's trace rather than starting a
second one.

Both halves read `app.version` and `app.environment` from the same public runtime config, so one
`NUXT_PUBLIC_OBSERVABILITY_APP_VERSION` stamps browser and server alike. It defaults to `0.0.0` —
set it at deploy time or nothing can be attributed to a release. Static assets and Nuxt's own dev
endpoints (`/_nuxt`, `/_fonts`, `/__nuxt`, `/favicon.ico`) are left untraced on purpose; the list
lives in the plugin.

The span is named for the **matched route**, not the path — it opens under the concrete URL, because
nothing has matched a route yet, and is renamed once the response is known. Anything that skips that
rename gives every slug and every query string a span name of its own, which makes the operation
impossible to aggregate and the keyspace unbounded. That is the property
[the spec](./server/plugins/observability.spec.ts) spends most of its assertions on.

## ✅ Testing

`pnpm test` runs Vitest on the [node preset](../../packages/configs/README.md) — the app has no
`vite.config.ts` to merge, so the vue preset is not wired up and nothing under `app/` is specced yet.
What is covered is [`server/plugins/observability.ts`](./server/plugins/observability.ts), the one
piece of app code with logic rather than composition.

Nitro auto-imports `defineNitroPlugin`, `useRuntimeConfig` and the `getRequest*` helpers at build
time, so the plugin imports none of them and they do not exist under Vitest. The spec stubs each as a
global — `defineNitroPlugin` before the module is imported, since it runs at evaluation. See the
`writing-tests` skill for the recipe.
