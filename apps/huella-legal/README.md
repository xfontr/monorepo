# 📦 @monorepo/huella-legal

A Nuxt 4 redesign of the Huella Legal law blog, composed from the workspace's shared UI, content,
translations and observability packages.

## 🚀 Development

```sh
pnpm exec nx serve @monorepo/huella-legal   # from anywhere in the workspace
pnpm dev                                    # or from this directory
```

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build (output in `.output/`) |
| `pnpm preview` | Preview the production build |
| `pnpm lint` | ESLint — the nuxt flavour, deliberately not type-checked |
| `pnpm typecheck` | `nuxt typecheck`. Redundant before a build: `typescript.typeCheck: "build"` makes `pnpm build` do the same pass, which is why the build is slow |
| `pnpm test` | Vitest in two projects, with coverage and its thresholds on every run — see [Testing](#-testing) |
| `pnpm test:e2e` | Playwright against the built `.output/`, with the vendors faked by MSW. Run `pnpm build` first; `nx test:e2e` does it for you |
| `pnpm exec nx nuxt-prepare @monorepo/huella-legal` | Regenerates `.nuxt` (`nuxi prepare`) — [`nx.json`](../../nx.json) already runs it before `lint`/`typecheck`/`test`, so this is only for calling it by hand |

Two modules beyond the shared ones are installed here: `@nuxt/fonts`, and `@pinia/nuxt` with
`pinia.storesDirs` widened to `./layers/*/app/stores/**`. That second path is load-bearing — a
store inside a layer is not picked up without it, and the failure looks like a missing composable
rather than a missing config.

## 🚢 Deployment

The app ships through Netlify's own git integration — there is no `netlify.toml` and no build or
deploy step in this repo. [`netlify-deployment.yml`](../../.github/workflows/netlify-deployment.yml)
builds and deploys nothing itself: once Netlify's own pipeline publishes a commit, it polls
Netlify's Deploys API for that commit and records a GitHub Deployment against the
`huella-legal` environment, so the live URL shows up on the repo's Deployments page
alongside `developer-portal` instead of only in Netlify's own dashboard.

The site ID and auth token never enter this repo: `NETLIFY_SITE_ID` is a GitHub Actions repo
variable and `NETLIFY_AUTH_TOKEN` a secret, both read at workflow runtime with no default. Netlify
deploys asynchronously after the push that triggers the workflow, so it polls for up to 10 minutes
rather than reading the API once.

## 🔑 Environment

Translations and articles are both fetched over the network, so an unset vendor is not a degraded
page but a `500` naming what is missing, on the first request that needs it.

| Variable | What it is |
| --- | --- |
| `NUXT_TRANSLATIONS_VENDOR_PROJECT` | The Tolgee project ID. Unset in development, where the project is fixed to `huella-legal` |
| `NUXT_TRANSLATIONS_VENDOR_BASE_URL` | The TMS API base URL (absolute, with scheme): the translations server in development, Tolgee in a build |
| `NUXT_TRANSLATIONS_VENDOR_OPTIONS_TOKEN` | The Tolgee API key. Unset in development |
| `NUXT_CONTENT_VENDOR_BASE_URL` | The WordPress site root, **without** `/wp-json` — the provider owns that path. Only `/articles` needs it |
| `NUXT_PUBLIC_OBSERVABILITY_URL` | Faro collector URL. Leave unset and browser telemetry stays off |
| `NUXT_PUBLIC_OBSERVABILITY_APP_VERSION` | Stamped on browser *and* server spans. Defaults to `0.0.0`, which nothing can be attributed to — set it at deploy time |
| `NUXT_PUBLIC_OBSERVABILITY_APP_ENVIRONMENT` | Stamped the same way. Defaults to `development` |
| `NUXT_OBSERVABILITY_URL` | Grafana OTLP gateway URL. Leave unset and server telemetry stays off |
| `NUXT_OBSERVABILITY_INSTANCE_ID` | Grafana Cloud instance ID, the user half of the OTLP credentials |
| `NUXT_OBSERVABILITY_TOKEN` | Grafana Cloud access token, the password half |

No URL or credential has a default in `nuxt.config.ts`, and no real URL or key belongs in the repo.
Every variable is read at **startup**, not at build time, so one build artifact runs in any
environment — the [i18n module](../../packages/i18n/src/nuxt/README.md#-usage) has the mechanism and
why nothing here reads `process.env`.

The vendor **names** are the exception, and they are not env vars: `translations.vendor.name` and
`content.vendor.name` select each vendor's config type, so they stay literals in `nuxt.config.ts`.

## 🌍 i18n

The site is Spanish-only. Two blocks in [`nuxt.config.ts`](./nuxt.config.ts) drive it: `i18n`
declares the one locale, and `translations.vendor` picks where the messages come from. The
`@monorepo/i18n/nuxt` module does the rest — installs `@nuxtjs/i18n`, registers a loader, and
mounts a cached `/api/translations/:locale` route so the TMS base URL and token never reach the
browser.

| Setting | Value | Why |
| --- | --- | --- |
| `locales` | `es-ES`, `language: "es"` | `language` is what `<html lang>` gets, so it reads `es`, not the locale code |
| `strategy` | `no_prefix` | Pages live at `/…`. `/es-ES/…` is a 404, not a redirect |
| `detectBrowserLanguage` | `false` | With one locale there is nothing to detect, and detection makes the server set an `i18n_redirected` cookie on pages the CDN caches |

### 🏷 Which vendor

| Mode | Vendor | Messages live in |
| --- | --- | --- |
| `nuxt dev` (the `$development` block) | `internal` | [`infrastructure/translations/projects/huella-legal/es-ES.json`](../../infrastructure/translations/projects/huella-legal/es-ES.json) |
| Any build, previews and production included | `tolgee` | The Tolgee project |

**This split is provisional, for early development.** Copy changes daily while the app is built,
and editing a JSON file in the repo is faster than keeping Tolgee current. Once that phase ends the
app moves to Tolgee everywhere and the `$development` block goes. Until then, Tolgee is **not** kept
in sync: a build shows raw keys for anything added since its last update, and that is expected.

To run it locally, start the translations server with `pnpm docker:up` in
[`infrastructure/translations`](../../infrastructure/translations) and set
`NUXT_TRANSLATIONS_VENDOR_BASE_URL=http://localhost:4000/`. The project is fixed to `huella-legal`,
and `internal` takes no token. The vendor `name` differs per mode rather than per env var because it
selects the vendor's config type.

### 🔤 Copy keys

UI copy is never hard-coded outside [`/lab`](./app/pages/lab). It goes in `es-ES.json` under a key:

| Rule | Example |
| --- | --- |
| The first segment is who owns the copy: `app` for the shell (head, layout, header, footer), a page by name, singular for a detail page, or a component in camelCase | `app.title`, `articles.title`, `article.back`, `articleCard.readingTime` |
| Then the element, then its role, all camelCase and nested as objects, never a dotted literal key | `articles.pagination.next` |
| Name the role, never the wording, so a copy edit never renames a key | `article.back`, not `article.backToArticles` |
| Parameters are named, and plurals use vue-i18n's `\|` form with the count as the second argument | `"{page} de {total}"`, `t("articleCard.minutes", n)` |
| `common` holds only copy whose meaning is the same wherever it appears | `common.loading` |
| Keys are sorted alphabetically at every level | — |

A key used in two places with two meanings is two keys, even while the Spanish happens to match.
Tolgee gets the same keys when it is next brought up to date.

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

[`app/`](./app) is the whole front end and stays thin: a layout, an error page and its dev-only debug
panel, two client plugins (Faro telemetry, and a dev-only console filter for a known Nuxt/Vue
warning), and three pages — an entry page and the two [article pages](#-content). The app's own
server code is one Nitro plugin, for telemetry.

Domain logic lives in Nuxt layers under [`layers/`](./layers), one directory per domain. Nuxt
auto-registers `<rootDir>/layers/*` by their presence, so there is no `extends` array to add, and
adding one is the mistake. That is the path `pinia.storesDirs` above is widened for.

| Layer | `shared/types/` | `server/` |
| --- | --- | --- |
| [`articles`](./layers/articles) | The view models: `ArticleSummary`, `Author`, `Category` | `toArticleSummary` maps an `Entry` into them, format rule included. Decoding and reading time use `entities`, `striptags` and `reading-time`, and stay server-side |

## 📡 Telemetry

Two halves, one per runtime, each from [`@monorepo/observability`](../../packages/observability) and
each skipped entirely when its URL is unset — which is why local dev ships nothing.

| Where | Plugin | Off switch |
| --- | --- | --- |
| Browser | [`app/plugins/observability.client.ts`](./app/plugins/observability.client.ts) | `NUXT_PUBLIC_OBSERVABILITY_URL` |
| Nitro | [`server/plugins/observability.ts`](./server/plugins/observability.ts) | `NUXT_OBSERVABILITY_URL` |

The server plugin opens the request span itself, by wrapping `nitroApp.h3App.handler`, because
`@monorepo/observability` ships no inbound HTTP instrumentation — [its
Gotchas](../../packages/observability/README.md#️-gotchas) say why. Wrapping the handler also means
internal `$fetch` calls nest under the request that made them, and an incoming `traceparent`
continues the browser's trace rather than starting a second one.

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

Three layers, each proving something the others can't see.

| Layer | Runs | Where | Command |
| --- | --- | --- | --- |
| `node` | Vitest on the [node preset](../../packages/configs/README.md) | `server/`, `shared/`, `tools/`, and the same in each `layers/*` | `pnpm test` |
| `nuxt` | Vitest in a booted Nuxt app on happy-dom, via `@nuxt/test-utils` | `app/`, and each `layers/*/app/` | `pnpm test` |
| e2e | Playwright, Chromium only, at 390, 768 and 1280 px | [`e2e/`](./e2e) | `pnpm exec nx e2e @monorepo/huella-legal` |

[`vitest.config.ts`](./vitest.config.ts) and [`playwright.config.ts`](./playwright.config.ts) are
wrappers over the shared presets in [`@monorepo/configs`](../../packages/configs/README.md), which
own the project split, where coverage lives, the widths and the baseline rules. What stays here is
what only this app knows: the thresholds (lines and statements 90, functions 85, branches 80), and
`app/lab/**` and `app/pages/**` kept out of the denominator, because the lab never ships and pages
are Playwright's. `test` always runs with `--coverage`, so the thresholds gate CI and pre-push.
[Decision 0028](../../docs/decisions/0028-huella-legal-e2e-and-visual-tooling.md) has the numbers.

- **Nitro auto-imports don't exist under the node project.** A spec for anything in `server/` stubs
  `defineNitroPlugin`, `useRuntimeConfig` and the `getRequest*` helpers as globals, and
  `defineNitroPlugin` before the import, since it runs at evaluation. See the `writing-tests` skill.
- **`import.meta.dev` compiles to `false` in the nuxt project**, as in every build a reader can
  reach. That is why the error page's debug panel is its own component,
  [`ErrorDebug.vue`](./app/components/ErrorDebug.vue): it can be mounted directly, where
  `error.vue` can only prove the panel stays hidden.

### 🎭 e2e

Playwright runs the built `.output/` server with [`e2e/server.ts`](./e2e/server.ts) preloaded through
`node --import`. That file starts MSW inside the server process with the fake WordPress from
`@monorepo/content/testing` and the fake Tolgee from `@monorepo/i18n/testing`, so there is no second
server and no upstream port. The vendor base URLs in `playwright.config.ts` point at `localhost`
paths nothing listens on, and a request no handler matches is logged by MSW and rejected, so none
reaches the network.

The data lives apart from the server, in [`e2e/fakes.ts`](./e2e/fakes.ts): domain entries built by
the seeded factories in `@monorepo/content/testing`, two of them pinned to the values the smoke spec
asserts on, plus the committed locale JSON in
[`infrastructure/translations`](../../infrastructure/translations/projects/huella-legal). The
packages turn those into each vendor's wire format, so the app never writes a WordPress or Tolgee
shape itself. There are no fixture files.

Each spec runs an axe scan against WCAG 2.1 AA and takes screenshots once per width. **Baselines are
written only in CI**, inside `mcr.microsoft.com/playwright:v1.63.0-noble`, which is why
`ignoreSnapshots` is on everywhere else. A Mac can't produce Linux baselines.

| Situation | What to do |
| --- | --- |
| New screenshot, no baseline | CI fails and uploads the `playwright` artifact. Commit its PNG under `e2e/__screenshots__/` |
| Changed screenshot | Commit the `-actual.png` from the artifact's `.playwright/` in place of the old baseline |
| Bumping `@playwright/test` | Move the image tag in [`ci.yml`](../../.github/workflows/ci.yml) in the same PR. Dependabot sends it alone for that reason |
| Running locally | Needs a Chromium that matches `@playwright/test`'s version in Playwright's browser cache. Nothing in the repo downloads one |
| A page needs new data | Add the `Entry` or `Term` to `e2e/fakes.ts`. A route the fakes don't serve is a change to the package's `testing` entry, with its spec |

Pre-push doesn't run e2e, so a green push is not yet a green `e2e` job.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| Firefox or WebKit | Another project per browser in the configs preset, and every baseline tripled. Linux WebKit is not Safari, so it won't stand in for iOS readers |
| A per-glob threshold on view models | A3 adds `shared/**` and `app/utils/**` at 95 alongside the mappers it creates |
| Parity with the `/lab` pages | Still a human check: the lab is stripped from production builds, and Linux substitutes a serif for Georgia |
