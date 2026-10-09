# 🟢 @monorepo/content/nuxt

The Nuxt integration for [`@monorepo/content`](../../README.md). One config block gives server code
a cached `useContent(event)`, so the CMS base URL (and, for a vendor that needs one, its
credentials) never leave the server. Nothing here is reachable from the browser: an app decides what
content reaches it, through routes of its own.

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

```ts
// server/api/articles/[slug].get.ts
export default defineEventHandler(async (event) => {
    const entry = await useContent(event).getEntry("posts", getRouterParam(event, "slug", { decode: true }) ?? "");

    return toArticle(entry);
});
```

`useContent` is a Nitro auto-import, so it exists in `server/` and nowhere else. It returns the
port's four reads — `listEntries`, `getEntry`, `listTerms`, `getTerm` — each cached, bounded and
mapped to an HTTP status, so a route calling it needs no casts, no URLs and no error handling of its
own. A miss throws a real `404`, which renders as an error page unless the route catches it.

The event is the first argument because Nitro's cache only hands a stale-while-revalidate refresh to
the platform's `waitUntil` when it is given one; without it, the refresh runs unawaited.

### Options

`content.vendor` is a `VendorConfig` — see [vendors](../../README.md#-vendors). `name` picks the
vendor from the registry, and the shape of the rest follows from that name, so an invalid
combination fails to typecheck in `nuxt.config`.

`runtimeConfig` (server-side, not `public`) carries the vendor for `useContent` to read per call, so
every field of it is overridable per deployment with the `NUXT_`-prefixed form —
`NUXT_CONTENT_VENDOR_BASE_URL`. Declare the field empty, as above, and never read `process.env` in
`nuxt.config` instead — the [i18n module](../../../i18n/src/nuxt/README.md#-usage) says why, and why
`name` stays a literal.

## 🧱 The two halves

```
module.ts                          # build-time: runs in Node during the consumer's build (@nuxt/kit)
config.ts                          # the contract between both halves: the windows, the config shape
runtime/server/utils/
├── useContent.ts                  # the Nitro auto-import: two cached functions over the provider
└── query.ts                       # defaults and ceilings for a typed query, each refusal a typed 400 or 404
```

`module.ts` and `runtime/**` are separate runtimes. Never import across that line except with
`import type` — anything shared at value level (the cache windows) goes in `config.ts`.

## 🔁 The read path

```
useContent(event).listEntries("posts", { perPage: 6 })
  → the query is defaulted and bounded, or 400               (query.ts)
  → content-list cache, keyed by contentKey(vendor, "posts", query)
    → createProvider(vendor, http) → provider.listEntries("posts", query)    (on a miss only)
      → GET :baseURL/wp-json/wp/v2/posts?per_page=6&_embed=…   (WordPress)

useContent(event).getEntry("posts", "hello-world")
  → content-item cache, keyed by the slug alone
    → provider.getEntry(...) → a one-item list by slug, since WordPress has no single-document endpoint
```

Media and taxonomies come back in the same round trip (`_embed`), so rendering a list costs one
upstream request rather than one per entry.

## 🗃 Caching

Both reads are `defineCachedFunction`s, created once when the module loads so concurrent misses for
one key share a single upstream request. They are keyed by `contentKey` from the core, and the
windows are fixed in `config.ts`:

| | `maxAge` | `staleMaxAge` |
| --- | --- | --- |
| a list | 1 h | 24 h |
| one document | 6 h | 7 d |

A document addressed by slug stays valid far longer than any list that a newly published entry
reorders. Dev bypasses both. A failed read is never stored: the next call tries the vendor again,
and a failed background refresh keeps serving the stale value.

The key comes from the core so a non-Nuxt consumer caching the same documents keys them the same
way instead of reinventing it — and it is built from the **normalised** query, so `{}`,
`{ page: 1 }` and `{ page: 1, perPage: 10 }` are one entry rather than three. See
[the key](../../README.md#-framework-agnostic-use) for what goes into it and why.

`contentKey` is word characters only because Nitro hands it to unstorage as-is, and unstorage's
`normalizeKey` cuts a key at `?` and treats `/`, `\` and `:` as separators. A key that spelled its
query out would lose or nest part of itself on the way to storage.

The query is bounded **before** the cached function is called, so a malformed one throws without
minting an entry. That is what makes the ceilings a keyspace bound for whatever a caller forwards
from its own request, rather than a validation nicety.

An app that maps content into view models usually doesn't need a cache of its own on top: a mapper
that runs in a few milliseconds is cheaper than a second window of staleness and a second set of keys
to purge.

## ⚠️ Gotchas

- **A slug from the router arrives encoded.** Read it with
  `getRouterParam(event, "slug", { decode: true })`, or an accented slug reaches WordPress encoded
  twice and 404s.
- **`title` and `body` are the vendor's HTML.** WordPress renders every text field, entities and
  all, so whatever reaches a page has to be rendered as HTML or decoded first — see
  [deferred](../../README.md#-deliberately-deferred).
- **The vendor config is checked at read time, not build time.** It has to be: `baseURL` can be
  replaced at boot by `NUXT_CONTENT_VENDOR_BASE_URL`, so the values present during the build are not
  necessarily the deployed ones. Unset config fails on the first cache miss with a `500` naming what
  is missing — see [validation](../../README.md#-validation). The vendor *name* is checked at build
  time as well, since an unknown one is a typo worth catching before deploy — but
  `NUXT_CONTENT_VENDOR_NAME` can still replace it at boot, in which case the read is what refuses it.
- **The provider is built per cache miss.** Cheap (the vendor module is import-cached) but not free,
  and it means a misconfigured deployment answers `500` on every miss with nothing said at boot.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| The browser reading content directly | There is no public content route, on purpose: an app's own route over `useContent` decides what reaches the browser, and a raw `Entry` carries unsanitised vendor HTML. A route that forwards query parameters gets the same ceilings for free |
| Purging an entry when the CMS changes | Both caches live in Nitro's `cache` storage under the `content` group, and `contentKey` is the only thing that knows the key format, so a purge belongs here rather than in the app |
