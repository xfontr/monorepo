# 📦 @monorepo/content

Shared content. A framework-agnostic core that reads entries and taxonomies out of a vendor
(a CMS), built as ports & adapters, plus an optional Nuxt module that mounts it as a cached
BFF in one config block.

Two entry points, kept apart by the `exports` map:

| Import | Contains | Depends on |
| --- | --- | --- |
| `@monorepo/content` | domain, ports, adapters, vendor registry, cache key | `ofetch`, `ohash` |
| `@monorepo/content/nuxt` | the Nuxt module and its runtime files — see [`src/nuxt/README.md`](./src/nuxt/README.md) | `@nuxt/kit`, `h3`, `nitropack` |

A React, Vue or plain Node consumer resolves the first and can never reach the second, so
nothing framework-specific leaks. That is enforced by module resolution, not discipline.

Everything the second entry point needs is an **optional peer dependency**, so resolving the
first installs none of it. If a non-Nuxt consumer ever ships to production, split the Nuxt half
into its own package — the optional-peer trick only holds while every consumer lives in this
workspace.

## 🗂 Structure

```
src/
├── index.ts                                  # the public API — the only surface consumers import
├── core/
│   ├── domain/
│   │   ├── content.ts                        # Entry, Term, Page, the resources, the query ceilings
│   │   └── errors.ts                         # what can go wrong, with an HTTP status attached
│   ├── ports/
│   │   ├── HttpClient.ts                     # driven port: the transport
│   │   └── ContentProvider.ts                # driven port: a vendor, and its config checks
│   ├── adapters/
│   │   ├── clients/
│   │   │   └── OfetchHttpClient.ts           # HttpClient over an injected ofetch instance
│   │   └── providers/
│   │       └── WordpressProvider.ts          # the `wordpress` vendor (WP REST API v2)
│   ├── contentKey.ts                         # which upstream document a request resolves to
│   └── registry.ts                           # vendor name → provider, and the config type
└── nuxt/                                     # the Nuxt module (separate entry point)
```

Nothing under `core/` imports `h3`, `nitropack` or `@nuxt/kit`, and `core/domain/` imports
nothing at all. That is the invariant worth keeping: the day it breaks, the core stops being
portable and the ports stop being worth their indirection.

## 📄 The domain

A vendor's shapes never leave its adapter. What consumers see is:

```ts
type Entry = { id, slug, title, excerpt?, body, publishedAt?, updatedAt?, image?, terms }
type Term  = { id, resource, slug, name, description? }
type Page<T> = { items: T[], page, perPage, total, totalPages }
```

Four resources, in two families, because a taxonomy is not a document:

| Family | Resources | Read with |
| --- | --- | --- |
| entries | `posts`, `pages` | `listEntries`, `getEntry` |
| terms | `categories`, `tags` | `listTerms`, `getTerm` |

`isEntryResource` / `isTermResource` are exported to sort a string from a URL into one of them.
Both unions are derived from the runtime arrays, so the list and the type cannot drift apart.

`body` and `excerpt` are `RichText` — `{ format, value }`, where `format` is `html`, `markdown`
or `blocks`. The `blocks` case exists from the start so a structured-content vendor is not a
breaking change later. **`title` is not `RichText`, and holds whatever the vendor rendered** —
for WordPress that is entity-escaped HTML, so a consumer has to render it as HTML. See
[deferred](#-deliberately-deferred).

Ids are strings, always, even where the vendor numbers them.

## 🏷 Vendors

A vendor is one entry in [`core/registry.ts`](./src/core/registry.ts). The registry is the
single source of truth: it drives both the runtime lookup and the config type, so config and
code cannot drift.

```ts
const providers = {
    wordpress: () => import("./adapters/providers/WordpressProvider"),
};
```

`VendorConfig` is derived from it. Each vendor declares its whole config on its provider class,
and the registry flattens it under `name`:

```ts
{ name: "wordpress", baseURL }        // exactly what WordpressProvider needs, and nothing else
```

There is no hoisted `baseURL`. For Contentful or Sanity the endpoint is derived from the
vendor's own config (a space, a dataset), so a shared one would be a field the consumer has to
invent — and the transport is built without a base URL for the same reason.

Adding a vendor:

1. Write `core/adapters/providers/<Name>Provider.ts` extending `ContentProvider<YourConfig>`,
   overriding `listEntries` and `listTerms` with that vendor's URL contract, and exporting its
   config type. File, class and registry key all carry the same `<Name>` — `wordpress` →
   `WordpressProvider.ts` → `class WordpressProvider`.
2. Override `configProblems()` to say when its config is unusable — see
   [validation](#-validation).
3. Add one line to `providers`.
4. Override `getEntry` / `getTerm` **only** if the vendor has a native single-document
   endpoint. Otherwise the inherited one-item list already serves them.
5. Nothing else. Config typing, lazy loading and the Nuxt routes follow automatically.

The import is lazy, so a deployment ships only the vendor it configured.

## 🔌 The ports

```ts
interface HttpClient {
    get<T>(url: string, options?: RequestOptions): Promise<HttpResponse<T>>
}

abstract class ContentProvider<T extends object = object> {
    abstract listEntries(resource: EntryResource, query?: EntryQuery): Promise<Page<Entry>>
    abstract listTerms(resource: TermResource, query?: Query): Promise<Page<Term>>
    protected abstract configProblems(): string[]

    getEntry(resource, slug): Promise<Entry>   // a one-item list, unless overridden
    getTerm(resource, slug): Promise<Term>
}
```

A provider knows its vendor's URL contract but delegates all I/O to an injected `HttpClient`,
so it binds to no transport. Composition happens at the edge — the consumer builds the client
and injects it.

Two things the port deliberately carries:

- **`url` is absolute.** A provider owns how its vendor is addressed, so no transport is ever
  configured with vendor knowledge.
- **`HttpResponse` exposes headers.** Vendors report pagination there — a body alone cannot
  build a `Page`.

And one thing it deliberately hides: a failed request surfaces as an `UpstreamError`, never as
a transport-specific one. Without that, the domain cannot tell "upstream said no" from "the
network is down", and the status it answers with would depend on which HTTP library is
installed.

There is no service layer on top of the provider port, deliberately: a class forwarding one
call to one collaborator would add a name and a file without adding behaviour. Callers talk to
the port directly. Wrap it in a service the day something real needs to live there.

## ✅ Validation

The registry types the config at compile time, but deploy-time values arrive from env vars, and
`process.env.WHATEVER ?? ""` typechecks fine. So a provider validates itself **in its
constructor**: it cannot exist misconfigured, the same way it cannot exist without a transport.
Every construction path is covered, not just `createProvider`.

What is knowable differs per vendor, so there is nothing to check in the base class — each
provider answers `configProblems()` for itself. `wordpress` requires a `baseURL` that parses as
an absolute URL, so a missing scheme (`wp.example.com`) is caught rather than silently becoming
a relative fetch.

It returns problems rather than throwing, so one `MisconfiguredVendorError` lists **all** of
them at once: fixing a deployment one restart per missing variable is the thing worth avoiding.

Because it is a `ContentError`, it needs no wiring at the edge: it reports as a `500` naming
what is unset, instead of the vendor being blamed with a `502` for config that never arrived.

> `configProblems()` is called from the base constructor, so an override may only read
> `config` — a subclass's own field initialisers have not run yet. The type system cannot
> enforce that; `core/ports/ContentProvider.spec.ts` pins it so the next vendor meets it in a
> test rather than in production.

## 🧩 Framework-agnostic use

```ts
import { ofetch } from "ofetch";
import { createProvider, OfetchHttpClient } from "@monorepo/content";

const http = new OfetchHttpClient(ofetch);
const provider = await createProvider({ name: "wordpress", baseURL: process.env.CONTENT_VENDOR_BASE_URL! }, http);

const page = await provider.listEntries("posts", { perPage: 6 });
const entry = await provider.getEntry("posts", "hello-world");
```

The transport is a constructor argument, so a provider cannot exist without one. Note it is
built with **no** `baseURL`: providers compose absolute URLs, so a client configured with one
vendor's host could not serve another. On a transport that is not ofetch, write the ten-line
`HttpClient` for it in your own app — that interface is the only thing the core needs.

Caching itself is **not** in the core — the Nuxt integration caches at its BFF route, and any
other consumer supplies its own. What *is* in the core is `contentKey(vendor, resource, query)`:
the identity of the upstream document, covering every input that picks it.

```ts
contentKey({ name: "wordpress", baseURL: "https://wp.test/" }, "posts", { page: 2, perPage: 6 })
// "wordpress_posts_s5YiZy223_u5QYmUTs0HlqRkJZWPuL6rTAixGVek1RLQ_4QAlrG9fdIh8SbxMRYDKQIXr1x_uzAaf2arip7_dLUsbE"
```

Four decisions in there:

- **The vendor config is hashed whole**, not listed field by field. Listing it would put a
  credential in a key that Nitro turns into a filesystem path or a KV entry; excluding it would
  let two deployments of the same vendor collide, because vendor config carries identity as
  readily as credentials — a Contentful environment and a Sanity dataset both live there.
- **The query axes are sorted and encoded before being hashed**, so two callers spelling one query
  differently share an entry, and a crafted value cannot forge an axis it did not ask for.
- **The key is word characters only.** Nitro deletes every non-word character from a custom cache
  key before storing it (`escapeKey`, in its cache runtime), so a key that spells its query out
  reaches storage with the separators gone: `search=b,slug=a` arrives as `searchbsluga`, and so
  does `search=bsluga`. Hashing the query half means the key that is built is the key that is
  stored — and it bounds the length, which a driver turning it into a filename cares about. The
  cost is that the query half is no longer readable in a cache listing; the vendor and the
  resource still are.

The ceilings in the domain — `MAX_PAGE`, `MAX_PER_PAGE`, `MAX_SEARCH_LENGTH` — are contract
limits, distinct from any vendor's own. They exist so a public route's key space is finite and a
crafted query cannot mint an unbounded number of cache entries. Apply them before you build a
key, not after.

## ⚠️ Errors

All of them extend `ContentError`, so one `instanceof` catches anything the package raises.

| Error | `statusCode` | Raised when |
| --- | --- | --- |
| `MalformedQueryError` | 400 | a query parameter is unparseable or out of range — the message says what was expected |
| `UndefinedResourceError` | 404 | the request names a resource, or a taxonomy, the domain does not have — the message lists the ones it does |
| `NotFoundError` | 404 | the vendor answered, with nothing under that slug |
| `UpstreamError` | 400 / 404 / 502 | the transport failed. A 400 or 404 relays the answer to the request that was actually made; **everything else is a 502**, because an upstream 401 or 403 means *our* credentials are wrong and must never invite the client to retry with different ones |
| `ContentUnavailableError` | 502 | the vendor failed for that resource in a way nothing else diagnosed (original error in `cause`) |
| `UndefinedVendorError` | 500 | config names a vendor the registry doesn't have — the message lists the registered names |
| `MisconfiguredVendorError` | 500 | the vendor exists but its config cannot work — `problems` lists every reason |

Each error carries its own `statusCode` / `statusMessage`, so adding one never means editing a
mapping somewhere else — the route just hands it to `createError`. A non-HTTP consumer ignores
both and reads `message`.

`statusMessage` reaches the client, so none of these repeat the vendor's URL or the transport's
message. Nothing else is dressed up as one of these either: a failure the package can't
diagnose — a broken adapter, say — propagates as itself, so the route reports it as an
unhandled 500 with its own stack rather than blaming the vendor.

## 🧭 Deliberately deferred

Sized for a small monorepo. When it grows:

| Later need | What changes |
| --- | --- |
| A timeout, or a retry policy | `OfetchHttpClient` passes only headers and query, so a slow vendor holds an SSR request open until the platform kills it — and `staleMaxAge` cannot help, because SWR only serves stale content after a successful fill. ofetch supports both natively: default them in the client, or widen `RequestOptions` if a provider needs to tune them per call |
| A `title` that is not HTML | `Entry.title` is a bare `string` holding whatever the vendor rendered, so a consumer has to know to `v-html` it while `body` and `excerpt` say so in their own type. Decode entities in the mapper (making it genuinely plain text) or type it `RichText` — the inconsistency is the bug, not the choice |
| Untrusted authors in the CMS | nothing sanitises the HTML in `body`. That is fine while the CMS is first-party, and a documented assumption rather than an oversight — a vendor whose authors are not trusted needs sanitising where it is rendered |
| A vendor with more than one document family | `Resource` is two closed unions. A vendor with custom post types needs them opened up, and `TAXONOMIES` in the WordPress adapter is where the mapping between its names and ours already lives |
| A vendor that actually serves locales | Nothing here has a locale axis — not `Query`, not the cache key, not the routes. Adding one is a single change across all three, and it has to be: a key that gains an axis *after* entries exist serves the wrong language until every one of them expires. A Polylang- or WPML-aware provider maps it to that plugin's `lang` parameter, and the route validating a tag should bound it — a BCP-47 pattern allows arbitrarily long subtag chains |
| A query axis one vendor serves and another can't | There is no error for it, because there is no such axis today. Add one — a 400 naming the vendor and the parameter — rather than letting a provider drop the axis: a dropped one is cached under the value that was asked for, which is worse than refusing |
| Structured content | `RichText` already carries a `blocks` format, so a Contentful or Sanity provider is not a breaking change for consumers |
| Tracing the upstream call | nothing here emits a span, and it cannot: the boundary rules let `type:content` depend on `type:config` only, and the Nuxt route builds its own transport. Instrument at the Nitro level from the app, or make the client injectable — but only when there is something to swap |
