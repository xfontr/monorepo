---
issue: 240
status: implemented
decision: accepted
---

# 🧭 Content is read on the server through `useContent`, not over a public route

## Context

`@monorepo/content/nuxt` mounted two public cached routes, `GET /api/content/:resource` and
`/:resource/:slug`, and auto-imported a client `useContent` that read them. It assumed pages render
`Entry` directly. Huella's rule is the opposite: a layer's `server/` maps vendor shapes into view
models "so an `Entry` never reaches the browser" ([`AGENTS.md`](../../apps/huella-legal/AGENTS.md)).
So #240's article routes had no server-side way into the module, and they `$fetch`ed its public
routes in-process: one Nitro server calling itself over h3.

That left a stopgap, `layers/articles/server/utils/fetchContent.ts`, which re-plumbed paths, casts
and status codes. It also left two cache layers for one read, a public endpoint serving raw `Entry`
that nothing needed, and a client composable whose only caller was the provisional `/publicaciones/`
scaffold. The question: what the package's Nuxt surface should be, given it must stay generic.

## Result

**The module exposes one server-only, cached `useContent(event)` and no route.** It is a Nitro
auto-import (`addServerImports`) with the port's four reads. Two module-scope `defineCachedFunction`s
back it: `content-list` and `content-item`, group `content`, with the existing windows. Both are
keyed by `contentKey(vendor, resource, query)`. Each read normalises and bounds its typed query
*before* the cached call, builds the provider only on a miss, and maps domain errors to h3 statuses
as the routes did. The public routes, `CONTENT_API_PATH` and the client composable are deleted.

Verified against nitropack 2.13.4, @nuxt/kit 4.5.2, h3 1.15.11, unstorage 1.17.5 and
@nuxtjs/i18n 10.6.0. Line numbers are as of this report:

| Question | Finding |
| --- | --- |
| Does `contentKey` work as `getKey`? | Yes. `defineCachedFunction` stores the key as given (`runtime/internal/cache.mjs:103`). Only `defineCachedEventHandler` runs `escapeKey` (`:131-135`). unstorage's `normalizeKey` still cuts at `?` and splits at `/ \ :`, so word-chars-only keys still matter |
| Are errors cached? | No. A thrown read is never stored (`:56-62`). A failed SWR refresh logs and keeps serving the stale value (`:89-94`) |
| Where does the event go? | First. The cache passes it to `waitUntil` only when `isEvent(args[0])` (`:86`, `:109`) |
| Should the functions be defined per call? | No: in-flight dedupe is a `pending` map per definition (`:23`) |
| Memoise the provider? | No. It is built only inside the resolver, so once per miss, as before. That keeps vendor config validated at read time, and `useRuntimeConfig(event)` clones config per event, so there is no stable identity to memoise on |
| Can the existing parsers bound typed input? | No. `toText` returns `undefined` for a non-string, so `{ page: 2 }` became page 1 and a typed `term` was dropped. `runtime/server/utils/query.ts` replaces `parsing.ts` with typed checks |
| Does the app's `Article` cache earn its keep? | No. `toArticle` on a 53 KB body (the 0027 corpus average) takes 4.1 ms, and four `toArticleSummary` calls take 9.0 ms. Measured warm, locally. A second cache doubled the worst-case staleness, and its slug key went through `escapeKey`, which merges `a-b` with `ab` |
| What did the public route expose? | Raw, unsanitised vendor HTML. Its key space was bounded on page, perPage and search length only: every distinct `slug`, `author` or term id cached its own empty `Page` |
| Is i18n the same case? | Same shape, different stakes. The browser fetches `/_i18n/<hash>/<locale>/messages.json` (`@nuxtjs/i18n` `runtime/context.js:131`), whose server route runs our loader, which self-fetches `/api/translations/:locale`. Translations are public by design and there is no client composable, so nothing leaks. Left as is |

| # | File | Change |
| --- | --- | --- |
| 1 | `packages/content/src/nuxt/runtime/server/utils/useContent.ts` (new) | The accessor and its two cached functions. Error mapping moved here from `request.ts` |
| 2 | `packages/content/src/nuxt/runtime/server/utils/query.ts` (new) | `toQuery`, `toEntryQuery`, `toSlug`: defaults, ceilings, trimmed text, known taxonomy, non-empty ids |
| 3 | `packages/content/src/nuxt/module.ts`, `config.ts` | One `addServerImports`. `CONTENT_API_PATH` is gone |
| 4 | `content.get.ts`, `contentItem.get.ts`, `utils/request.ts`, `utils/parsing.ts`, `composables/*` | Deleted. Their spec cases moved to `useContent.spec.ts` and `query.spec.ts` |
| 5 | `apps/huella-legal/layers/articles/server/api/articles/[slug].get.ts`, `[slug]/related.get.ts` | `defineEventHandler` over `useContent(event)`. The slug is read with `{ decode: true }`, since nothing re-encodes it now |
| 6 | `…/api/articles/index.get.ts` (new) | `Page<ArticleSummary>`. Only `page` is forwarded; `perPage` is fixed at 6 |
| 7 | `…/app/pages/articles/index.vue` | `useFetch("/api/articles")`. Renders summaries as text, with no `v-html` |
| 8 | `…/server/cache.ts`, `…/server/utils/fetchContent.ts` | Deleted |

## Options considered

| Option | Why not |
| --- | --- |
| Keep the routes and add a server helper over them | Formalises the self-call. Paths, query strings, casts and status codes still serialise and re-parse inside one process, and the public raw endpoint stays |
| Routes and client composable behind a module option | Config, specs and docs for a surface with no consumer. A browser-facing route is a few lines in an app over `useContent`, where the app decides what the browser gets |
| An uncached `useContentProvider`, with each app caching its view models | Every app would re-derive keys and ceilings, the very thing `contentKey` exists to stop. The expensive part is the upstream round trip, not a 4 ms mapping |
| Keep the app's `Article` and related caches on top | Up to 12 h before a correction shows, two key families to purge, and the `escapeKey` collisions above — all to save single-digit milliseconds |
| A separate server name beside the client `useContent` | Two functions with one job and a confusing pair of names |

## Consequences

Server code reads content with typed calls and no plumbing, and nothing raw has a public URL. The
cost is that every browser-facing read needs an app route. #241 (C2) extends `GET /api/articles`
with filters rather than writing it, and #248 (C5) searches through a route over `useContent`.

#236 gets simpler. There is one cache layer, so the worst case for a correction to reach a post
falls from about 12 h to 6 h. A purge touches one key family, the `content` group, whose key format
only the package knows.

Two earlier reports describe what no longer exists, and neither is edited, since each is a record of
its own decision:

- [0030](./0030-huella-legal-rendering-hosting-and-cost.md)'s `/api/content/**` route rule and its
  finding that "browsers fetch `/api/content/*`". F1 should drop both.
- [0027](./0027-huella-legal-content-model.md)'s change 11, which had the article route build its
  own provider. `useContent` is now that route's entry point.

Revisit if a consumer genuinely needs raw `Entry` in the browser. That is an app route, not a
package one. Revisit also if Nitro starts escaping function keys or changes where it reads the event.

## Confirmation

| Claim | Check |
| --- | --- |
| No public content route, and no client `useContent` | `grep -rl "api/content" apps/huella-legal/.output` after `pnpm exec nx build @monorepo/huella-legal` prints nothing |
| Bounds run before a key exists, and typed input survives normalising | `pnpm exec nx test @monorepo/content`: `useContent.spec.ts` "refuses … without keying it", `query.spec.ts` "keeps the page that was asked for" and "keeps the term and the author" |
| Defaults collapse to one entry | `useContent.spec.ts` "gives %o the same entry as the first page" |
| The module registers a server import and no route | `module.spec.ts` "auto-imports useContent into server code" |
| Article routes read decoded slugs and cache nothing themselves | `pnpm exec nx test @monorepo/huella-legal`: `[slug].get.spec.ts` "its slug decoded". `git grep defineCachedEventHandler apps/huella-legal/layers` prints nothing |
| The listing, the article and its 404 still work end to end | `pnpm exec playwright test` in `apps/huella-legal` after a build |
| The browser never fetches `/api/translations` | `grep -rl "api/translations" apps/huella-legal/.output/public` prints nothing |
