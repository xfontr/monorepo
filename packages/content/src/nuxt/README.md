# 🟢 @monorepo/content/nuxt

The Nuxt integration for [`@monorepo/content`](../../README.md). One config block mounts a
cached BFF that proxies the vendor and auto-imports the composable that reads it — so the CMS
base URL (and, for a vendor that needs one, its credentials) never reach the client.

## 🚀 Usage

```ts
export default defineNuxtConfig({
    modules: ["@monorepo/content/nuxt"],

    content: {
        vendor: {
            name: "wordpress",
            baseURL: "",   // filled from NUXT_CONTENT_VENDOR_BASE_URL at startup
        },
    },
});
```

```vue
<script setup lang="ts">
const { listEntries } = useContent();

const { data } = await useAsyncData("articles", () => listEntries("posts", { perPage: 6 }));
</script>
```

`useContent` is auto-imported and returns four thin fetchers — `listEntries`, `getEntry`,
`listTerms`, `getTerm` — that hit this module's own routes. They are **not** `useAsyncData`
wrappers, deliberately: the caller keeps its own key, caching and SSR strategy, which is the
half that differs per page. Pass a key you control, as above.

### Options

`content.vendor` is a `VendorConfig` — see [vendors](../../README.md#-vendors). `name` picks the
vendor from the registry, and the shape of the rest follows from that name, so an invalid
combination fails to typecheck in `nuxt.config`.

`runtimeConfig` (server-side, not `public`) carries the vendor for the routes to read per
request, so every field of it is overridable per deployment with the `NUXT_`-prefixed form —
`NUXT_CONTENT_VENDOR_BASE_URL`. **Never read `process.env` in `nuxt.config` instead**, as the
[i18n module](../../../i18n/src/nuxt/README.md#options) argues at more length: a value read there is
resolved at build time and baked into the output, which freezes the artifact to the host that built
it. Declare the field empty, as above — the key has to exist for Nuxt to override it — and let the
environment fill it at startup. `name` is the exception: it picks the vendor and its config type, so
it stays a literal.

## 🧱 The two halves

```
module.ts                          # build-time: runs in Node during the consumer's build (@nuxt/kit)
config.ts                          # the contract between both halves: the API path, the windows, the config shape
runtime/
├── composables/useContent.ts       # the client-side fetchers, compiled by the consumer's Vite
└── server/
    ├── content.get.ts              # cached BFF route: a list
    ├── contentItem.get.ts          # cached BFF route: one document
    └── request.ts                  # everything both routes do to an incoming request
```

`module.ts` and `runtime/**` are separate runtimes. Never import across that line except with
`import type` — anything shared at value level (`CONTENT_API_PATH`, the cache windows) goes in
`config.ts`.

`request.ts` is where the routes are thin: parsing, ceilings, provider construction and the
error mapping all live there, so each handler is its own six lines of orchestration. It is also
the only file in the package that knows both h3 and the core.

## 🔁 The request path

```
listEntries("posts", { perPage: 6 })
  → GET /api/content/posts?perPage=6                 (content.get.ts, cached)
    → :resource must be one of posts|pages|categories|tags, or 404
    → the query is parsed, defaulted and bounded, or 400
    → createProvider(vendor, http) → provider.listEntries("posts", query)
      → GET :baseURL/wp-json/wp/v2/posts?per_page=6&_embed=…   (WordPress)

getEntry("posts", "hello-world")
  → GET /api/content/posts/hello-world               (contentItem.get.ts, cached)
    → provider.getEntry(...) → a one-item list by slug, since WordPress has no single-document endpoint
```

Media and taxonomies come back in the same round trip (`_embed`), so rendering a list costs one
upstream request rather than one per entry.

The single document has a route of its own rather than being resolved in the composable, so a
miss answers with a real `404` that renders as an error page — and so a vendor with a native
single-document endpoint can serve it without a list round-trip.

## 🗃 Caching

Both routes are `defineCachedEventHandler`, keyed by `contentKey` from the core rather than by
the request URL. The windows are fixed in `config.ts` rather than configurable, because Nitro
reads them when the handler module loads and they cannot vary per request:

| | `maxAge` | `staleMaxAge` |
| --- | --- | --- |
| a list | 1 h | 24 h |
| one document | 6 h | 7 d |

A document addressed by slug stays valid far longer than any list that a newly published entry
reorders. Dev bypasses both. Override from `nuxt.config` with a nitro route rule if a deployment
needs to.

The key comes from the core so a non-Nuxt consumer caching the same documents keys them the same
way instead of reinventing it — and it is built from the **parsed** query, so `?page=1`, `?page=01`
and no page at all are one entry rather than three. See
[the key](../../README.md#-framework-agnostic-use) for what goes into it and why.

Nitro does not store a custom key verbatim: it strips every non-word character first. `contentKey`
is word characters only for that reason, so nothing is lost between building the key and storing
it — a key that spelled its axes out with `:` and `=` would arrive with them deleted and collide
with a query that never asked for them.

Note that `getKey` runs *before* the handler, so it parses the request too: a malformed query
throws there and mints no entry at all. That is what makes the ceilings a keyspace bound rather
than a validation nicety.

## ⚠️ Gotchas

- **A slug is decoded from the path, and encoded into it.** `useContent` encodes; the route
  decodes with `getRouterParam(event, "slug", { decode: true })`. Anything hand-rolling a
  request has to encode too, or an accented slug reaches WordPress encoded twice and 404s.
- **The list route serves both families.** `/api/content/:resource` answers `Page<Entry>` or
  `Page<Term>` depending on the resource, and the composable is what narrows it. One route,
  keyed by resource — but the response type is only as good as the method you called.
- **`title` and `body` are the vendor's HTML.** WordPress renders every text field, entities and
  all, so a page needs `v-html` for them — see
  [deferred](../../README.md#-deliberately-deferred).
- **A `locale` 400s on a WordPress deployment.** Core WordPress has no locale axis and the
  provider refuses one rather than dropping it. Pass one only to a vendor that serves it.
- **The vendor config is checked at request time, not build time.** It has to be: `baseURL` can
  be replaced at boot by `NUXT_CONTENT_VENDOR_BASE_URL`, so the values present during the build
  are not necessarily the deployed ones. Unset config fails on the first content request with a
  `500` naming what is missing — see [validation](../../README.md#-validation). The vendor
  *name* is checked at build time as well, since an unknown one is a typo worth catching before
  deploy rather than on the first request — but `NUXT_CONTENT_VENDOR_NAME` can still replace it
  at boot, in which case the route is what refuses it.
- **The provider is built per request.** Cheap (the vendor module is import-cached) but not free,
  and it means a misconfigured deployment answers `500` on every request with nothing said at
  boot.
