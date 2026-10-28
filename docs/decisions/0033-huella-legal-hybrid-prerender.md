---
issue: 302
status: implemented
decision: accepted
---

# 🧭 Huella Legal's hybrid prerender

## Context

[0030](./0030-huella-legal-rendering-hosting-and-cost.md) rejected a full static build because
WordPress has no webhooks: new posts would need hourly rebuilds, 720 production deploys a month. It
recorded `isr` route rules on Netlify as the path not taken, and the app shipped fully SSR with no
`routeRules`, so every page view invoked a function. #302 measured the real cadence: one or two
articles a week, a new author every week or two, and copy and code that barely move once the
redesign ships. It also notes that prerendered HTML runs on any host, while `isr` is Netlify's alone.

## Result

**Pages that read nothing from the query string are prerendered on every Netlify build, and the rest
are served from Netlify's CDN under a one-day `isr`.** A prerendered file can't vary on the query, so
`/publicaciones/?page=2` would serve page 1. That rules out the listings and search.

| Route | Mode |
| --- | --- |
| `/:slug/`, every post and every slug in `public.pageSlugs` | Prerendered. A slug not on disk falls through to `/**` |
| `/areas/`, `/colaboradores/`, `/calculo-intereses/`, `/publicar/` | Prerendered |
| `/` | `isr` 86400. It changes weekly, so it shouldn't wait for a rebuild |
| `/publicaciones/`, `/areas/*`, `/etiquetas/*`, `/colaboradores/*` | `isr` 86400, `Netlify-Vary: query=page\|sort\|format` |
| `/buscar/`, `/api/search` | `isr` 86400, `Netlify-Vary: query=query\|page` |
| `/api/articles` | `isr` 86400, `Netlify-Vary` on all six keys of `listingQuerySchema` |
| `/publicaciones/_payload.json`, `/areas/*/_payload.json`, `/etiquetas/*/_payload.json`, `/colaboradores/*/_payload.json`, `/buscar/_payload.json` | `isr` 86400 and the page's `Netlify-Vary` |
| `/api/articles/**`, `/api/pages/**`, `/api/authors`, `/api/subjects`, `/api/home`, `/api/translations/**`, `/_i18n/**` | `isr` 86400. The browser calls them when no payload carries the data |
| `/api/**`, `/robots.txt` | `isr: false` |

**Client navigation reads payloads, not the API.** Nuxt 4.5 compiles every `isr` rule into a
client-side `payload` rule, so navigation and link prefetch fetch `<route>/_payload.json`, query
string included. Nuxt copies only `isr` onto a payload path and skips wildcard routes, so the payload
rows above carry their own `Netlify-Vary`. With `payloadExtraction: true` every `isr` page also made
its first view fetch that payload as a second request, so it is `"client"`: inlined on a first view,
extracted for navigation, and still written beside each prerendered page.

A new article goes live without a rebuild. Its slug isn't on disk, so the function renders it once,
the CDN keeps it, and the next build writes it as a file.

**Only a Netlify build prerenders.** CI and e2e build the same app without a Tolgee token, and e2e
serves `.output` with the vendors faked. A prerendered file there would shadow the fakes. Netlify
sets `CONTEXT` on every build, so the module reads that, as `requiredEnv` already does.

| Change | Where |
| --- | --- |
| The rule table above | `apps/huella-legal/modules/rendering.ts`, through `extendRouteRules` |
| `experimental.payloadExtraction: "client"` | `apps/huella-legal/nuxt.config.ts` |
| Under `CONTEXT`: `failOnError`, plus the routes from a `prerender:routes` hook, with post slugs listed through `@monorepo/content`'s `createProvider` and page slugs from `NUXT_PUBLIC_PAGE_SLUGS` when set | `apps/huella-legal/modules/rendering.ts` |
| A prerendered page whose messages didn't load fails with a `502` | `apps/huella-legal/app/plugins/prerenderTranslations.server.ts` |
| A 5xx answers `netlify-cdn-cache-control: no-store` from Nitro's `error` hook | `apps/huella-legal/server/plugins/cdn.ts` |
| Author counts render on the server, so a prerendered article carries them | `layers/articles/app/composables/useArticle.ts`, `server: false` dropped |
| `CONTEXT` is a cache input of `build` and `nuxt:build` | `apps/huella-legal/package.json` |
| A weekly production build through a Netlify build hook | `.github/workflows/huella-legal-rebuild.yml`, secret `NETLIFY_BUILD_HOOK_URL` |

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
| A `Netlify-CDN-Cache-Control` header rule in place of each `isr` | It keeps Nuxt off payloads, but hand-writes both of the preset's headers per rule. Once a first view inlines its payload, payloads cost nothing extra |
| `payloadExtraction: false` | Prerendered pages would lose their `_payload.json`, so navigating to an article would call the API instead of reading a file |

## Consequences

The weekly rebuild refreshes what goes stale on a prerendered page: author counts, the related posts
band, and corrections to old posts. At 15 credits a production deploy, that is about 75 credits a
month on a credit plan. A failed build leaves the previous deploy live, so failing loudly costs
nothing. The build hook also serves as the manual purge after an urgent correction. Link prefetch
adds one payload request per visible link to an `isr` route, which the CDN answers after its first
miss.

`useCachedFetch` stays. Nuxt's default reuses data only while hydrating or from a loaded payload,
and the wrapper still saves a session's repeat reads, such as returning to a listing page already
seen.

Revisit this if articles start arriving daily, since a week-old file would then lag the listings
that link to it, or when the app leaves Netlify. On Google Cloud, the files go to Firebase Hosting or
Cloud Storage unchanged, each `isr` row becomes `Cache-Control: s-maxage=86400,
stale-while-revalidate`, the hook becomes a Cloud Build trigger, and the 5xx guard becomes
`Cache-Control: no-store`.

**Tripwires.**
- A preview build fails without `NUXT_TRANSLATIONS_VENDOR_OPTIONS_TOKEN`, since the guard has no
  messages to find. Netlify has to expose it to the deploy-preview context as well as production.
- Prerendered pages bake in public runtime config, `public.site.url` included, so a preview's share
  link points at production.
- Post slugs come from the `content.vendor.baseURL` literal, while prerendered pages read
  `NUXT_CONTENT_VENDOR_BASE_URL`. If the two disagree, missing posts fail the build, which is
  intended.
- Netlify needs the same `Netlify-Vary` on every response for a URL, so it lives in `routeRules` and
  never in a handler. `/` never gets one, because a non-matching query shares the bare URL's entry.
- The `Netlify-Vary` keys must match the keys each route reads: `useArticleListing`,
  `listingQuerySchema` in `server/api/articles/index.get.ts`, and `searchQuerySchema` in
  `server/api/search.get.ts`. Each listing's `_payload.json` row repeats its page's keys.
- Every link prefetches its target's payload, so a link to a missing page logs a 404 to the console.
  e2e fails on browser output, so its fakes carry every page and term a fake post links to.
- `/robots.txt` varies by host. If it becomes a static file, previews need an `X-Robots-Tag` header
  per Netlify context.
- A `404` is cached for a day like any other answer, so a slug requested before WordPress publishes
  it stays a 404 until the TTL lapses or a build runs.
- Locally the build is `node-server`, where `isr` is inert. Reproduce Netlify with
  `NITRO_PRESET=netlify`, then delete `apps/huella-legal/.netlify` and `dist` before any `nx` command.
  `.netlify` isn't gitignored, and its function's `package.json` registers as an Nx project,
  `@monorepo/huella-legal-prod`, whose bundle `eslint` never finishes.

## Confirmation

| Claim | Check |
| --- | --- |
| A Netlify build prerenders every slug and the query-free routes | `CONTEXT=deploy-preview pnpm exec nx build @monorepo/huella-legal --skip-nx-cache` with a Tolgee token, then `.output/public/<slug>/index.html` exists for every post, with no `publicaciones`, `etiquetas` or `buscar` directory |
| Other builds prerender nothing | The same build without `CONTEXT` writes no `index.html` under `.output/public` |
| An unreachable WordPress or Tolgee fails the build | The `CONTEXT` build with `NUXT_CONTENT_VENDOR_BASE_URL`, or `NUXT_TRANSLATIONS_VENDOR_BASE_URL`, at an unreachable host exits non-zero |
| The rules reach the function | After a `NITRO_PRESET=netlify` build, `grep -o '"isr":[a-z0-9]*' apps/huella-legal/.netlify/functions-internal/server/chunks/nitro/nitro.mjs \| sort \| uniq -c` lists `86400` and `false` |
| Listing payloads vary like their pages | After the same build, `grep -B1 Netlify-Vary apps/huella-legal/dist/_headers` lists each `_payload.json` row beside its page |
| A first view makes no payload request | A prerendered `index.html` holds `data-nuxt-data` and no `data-src` |
| Articles come from disk | On a preview, an article's response carries no function invocation in Netlify's logs |
| The fallback renders and caches | On a preview, a slug not on disk renders, and a second request shows `hit` in `cache-status` |
| Listings vary on their keys only | On a preview, `/publicaciones/?page=2` shows page 2, and `?page=2&utm_source=x` shares its entry |
| Errors aren't stored | On a preview with WordPress unreachable, a URL not on disk answers 5xx, and a second request's `cache-status` shows no `stored` |
| The hook URL stays out of the repo | `git grep -n "api.netlify.com/build_hooks"` finds nothing |
