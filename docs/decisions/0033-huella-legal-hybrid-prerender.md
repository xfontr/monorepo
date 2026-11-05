---
issue: 302
status: implemented
decision: accepted
---

# 🧭 Huella Legal's hybrid prerender

## Context

[0030](./0030-huella-legal-rendering-hosting-and-cost.md) rejected a full static build because
WordPress has no webhooks: new posts would need hourly rebuilds, 720 production deploys a month. It
recorded `isr` route rules as the path not taken, and the app shipped fully SSR with no
`routeRules`, so every page view invoked a function. #302 measured the real cadence: one or two
articles a week, a new author every week or two, and copy and code that barely move once the
redesign ships. It also notes that prerendered HTML runs on any host.

## Result

**Pages that read nothing from the query string are prerendered on every deploy build, and the rest
are served under a one-day `isr`.** A prerendered file can't vary on the query, so
`/publicaciones/?page=2` would serve page 1. That rules out the listings and search.

| Route | Mode |
| --- | --- |
| `/:slug/`, every post and every slug in `public.pageSlugs` | Prerendered. A slug not on disk falls through to `/**` |
| `/areas/`, `/colaboradores/`, `/calculo-intereses/`, `/publicar/` | Prerendered |
| `/` | Prerendered, for its TTFB on mobile, so a new post reaches it only on the next build until a publish triggers one |
| `/publicaciones/`, `/areas/*`, `/etiquetas/*`, `/colaboradores/*` | `isr` 86400 |
| `/buscar/`, `/api/search` | `isr` 86400 |
| `/api/articles` | `isr` 86400 |
| `/publicaciones/_payload.json`, `/areas/*/_payload.json`, `/etiquetas/*/_payload.json`, `/colaboradores/*/_payload.json`, `/buscar/_payload.json` | `isr` 86400 |
| `/api/articles/**`, `/api/pages/**`, `/api/authors`, `/api/subjects`, `/api/home`, `/api/translations/**`, `/_i18n/**` | `isr` 86400. The browser calls them when no payload carries the data |
| `/api/**`, `/robots.txt` | `isr: false` |

**Client navigation reads payloads, not the API.** Nuxt 4.5 compiles every `isr` rule into a
client-side `payload` rule, so navigation and link prefetch fetch `<route>/_payload.json`, query
string included. With `payloadExtraction: true` every `isr` page also made
its first view fetch that payload as a second request, so it is `"client"`: inlined on a first view,
extracted for navigation, and still written beside each prerendered page.

A new article goes live without a rebuild. Its slug isn't on disk, so the function renders it once,
the CDN keeps it, and the next build writes it as a file.

**Only a deploy build prerenders.** CI and e2e build the same app without a Tolgee token, and e2e
serves `.output` with the vendors faked. A prerendered file there would shadow the fakes.

| Change | Where |
| --- | --- |
| The rule table above | `apps/huella-legal/modules/rendering.ts`, through `extendRouteRules` |
| `experimental.payloadExtraction: "client"` | `apps/huella-legal/nuxt.config.ts` |
| Under `NUXT_SITE_ENV`: `failOnError`, plus the routes from a `prerender:routes` hook, with post slugs listed through `@monorepo/content`'s `createProvider` and page slugs from `NUXT_PUBLIC_PAGE_SLUGS` when set | `apps/huella-legal/modules/rendering.ts` |
| A prerendered page whose messages didn't load fails with a `502` | `apps/huella-legal/app/plugins/prerenderTranslations.server.ts` |
| Author counts render on the server, so a prerendered article carries them | `layers/articles/app/composables/useArticle.ts`, `server: false` dropped |
| `NUXT_SITE_ENV` is a cache input of `build` and `nuxt:build` | `apps/huella-legal/package.json` |
| A weekly production build through a build hook | `.github/workflows/huella-legal-rebuild.yml` |

The Tolgee guard runs inside the prerender rather than as a ping from the config. The prerender
reads `NUXT_TRANSLATIONS_*` at runtime, so a ping of the config literal could pass while every page
renders raw keys. It checks that messages loaded, not that every key exists, because Tolgee is
deliberately behind the repo's copy during early development.

## Options considered

| Option | Why not |
| --- | --- |
| `isr` on every page, as 0030 drew it | Every first view after a TTL lapse still runs a function, and `isr` doesn't carry over to Google Cloud. Prerendering does |
| Full static, listings included | A static host ignores the query string, so every listing page would serve page 1 |
| `crawlLinks` instead of listing slugs | The crawler reaches articles only through the query-paged listings, and would write those listings to disk |
| Prerender on every build | CI has no Tolgee token, and the prerendered files would shadow e2e's fakes |
| Scanning the prerendered HTML for raw keys | Raw keys are expected while Tolgee lags the repo, so it would fail every build |
| Keeping author counts client-side and only caching `/api/authors` | Each view of a prerendered article would still call a function |
| `payloadExtraction: false` | Prerendered pages would lose their `_payload.json`, so navigating to an article would call the API instead of reading a file |

## Consequences

The weekly rebuild refreshes what goes stale on a prerendered page: author counts, the related posts
band, and corrections to old posts. A failed build leaves the previous deploy live, so failing loudly costs
nothing. The build hook also serves as the manual purge after an urgent correction. Link prefetch
adds one payload request per visible link to an `isr` route, which the CDN answers after its first
miss.

`useCachedFetch` stays. Nuxt's default reuses data only while hydrating or from a loaded payload,
and the wrapper still saves a session's repeat reads, such as returning to a listing page already
seen.

Revisit this if articles start arriving daily, since a week-old file would then lag the listings
that link to it.

**Tripwires.**
- A preview build fails without `NUXT_TRANSLATIONS_VENDOR_OPTIONS_TOKEN`, since the guard has no
  messages to find.
- Prerendered pages bake in public runtime config, `public.site.url` included, so a preview's share
  link points at production.
- Post slugs come from the `content.vendor.baseURL` literal, while prerendered pages read
  `NUXT_CONTENT_VENDOR_BASE_URL`. If the two disagree, missing posts fail the build, which is
  intended.
- Every link prefetches its target's payload, so a link to a missing page logs a 404 to the console.
  e2e fails on browser output, so its fakes carry every page and term a fake post links to.
- `/robots.txt` varies by host. If it becomes a static file, previews need an `X-Robots-Tag`
  header.
- A `404` is cached for a day like any other answer, so a slug requested before WordPress publishes
  it stays a 404 until the TTL lapses or a build runs.

## Confirmation

| Claim | Check |
| --- | --- |
| A deploy build prerenders every slug and the query-free routes | `NUXT_SITE_ENV=preview pnpm exec nx build @monorepo/huella-legal --skip-nx-cache` with a Tolgee token, then `.output/public/<slug>/index.html` exists for every post, with no `publicaciones`, `etiquetas` or `buscar` directory |
| Other builds prerender nothing | The same build without `NUXT_SITE_ENV` writes no `index.html` under `.output/public` |
| An unreachable WordPress or Tolgee fails the build | The `NUXT_SITE_ENV` build with `NUXT_CONTENT_VENDOR_BASE_URL`, or `NUXT_TRANSLATIONS_VENDOR_BASE_URL`, at an unreachable host exits non-zero |
| A first view makes no payload request | A prerendered `index.html` holds `data-nuxt-data` and no `data-src` |
| The fallback renders and caches | On a preview, a slug not on disk renders, and a second request shows `hit` in `cache-status` |
