# 📦 @monorepo/i18n

Shared translations. A framework-agnostic core that fetches locale messages from a vendor
(a TMS), built as ports & adapters, plus an optional Nuxt module that wires it up in one
config block.

Two entry points, kept apart by the `exports` map:

| Import | Contains | Depends on |
| --- | --- | --- |
| `@monorepo/i18n` | domain, ports, adapters, vendor registry | `ofetch`, `ohash` |
| `@monorepo/i18n/nuxt` | the Nuxt module and its runtime files — see [`src/nuxt/README.md`](./src/nuxt/README.md) | `@nuxt/kit`, `@nuxtjs/i18n`, `h3`, `nitropack` |

A React, Vue or plain Node consumer resolves the first and can never reach the second, so
nothing framework-specific leaks. That is enforced by module resolution, not discipline.

Everything the second entry point needs is an **optional peer dependency**, so resolving the
first installs none of it. Only `ofetch` and `ohash` are real dependencies — the second because a
cache key has to survive Nitro stripping it, see [caching](#-framework-agnostic-use). If a non-Nuxt consumer ever
ships to production, split the Nuxt half into its own package — a package that is a Nuxt
module is allowed to depend on `@nuxt/kit` outright, and the optional-peer trick only holds
while every consumer lives in this workspace.

## 🗂 Structure

```
src/
├── index.ts                                  # the public API — the only surface consumers import
├── core/
│   ├── domain/
│   │   ├── errors.ts                         # what can go wrong, with an HTTP status attached
│   │   ├── translations.ts                   # Locale, TranslationMap
│   │   └── vendor.ts                         # vendor config shape
│   ├── ports/
│   │   ├── HttpClient.ts                     # driven port: the transport
│   │   └── TranslationProvider.ts            # driven port: a vendor, and its config checks
│   ├── adapters/
│   │   ├── clients/
│   │   │   └── OfetchHttpClient.ts           # HttpClient over an injected ofetch instance
│   │   └── providers/
│   │       ├── InternalProvider.ts           # the `internal` vendor (our own TMS)
│   │       └── TolgeeProvider.ts             # the `tolgee` vendor
│   ├── translationsKey.ts                    # which upstream document a request resolves to
│   └── registry.ts                           # vendor name → provider, and the config type
└── nuxt/                                     # the Nuxt module (separate entry point)
```

Nothing under `core/` imports `@nuxt/kit` or `@nuxtjs/i18n`, and `core/domain/` imports nothing at
all. That is the invariant worth keeping: the day it breaks, the core stops being portable and the
ports stop being worth their indirection.

## 🏷 Vendors

A vendor is one entry in [`core/registry.ts`](./src/core/registry.ts). The registry is the
single source of truth: it drives both the runtime lookup and the config type, so config and
code cannot drift.

```ts
const providers = {
    internal: () => import("./adapters/providers/InternalProvider"),
    tolgee: () => import("./adapters/providers/TolgeeProvider"),
};
```

`VendorConfig` is derived from it. Each vendor's `options` field is read off its provider
class, so a vendor that needs options makes them **required** in config, and a vendor that
needs none **forbids** them:

```ts
{ name: "internal", project: "external", baseURL }        // options not allowed
{ name: "tolgee", project: "1234", baseURL, options: { token } } // options required
```

Adding a vendor:

1. Write `core/adapters/providers/<Name>Provider.ts` extending `TranslationProvider`, overriding
   `getTranslations` with that vendor's URL contract. File, class and registry key all carry the
   same `<Name>` — `internal` → `InternalProvider.ts` → `class InternalProvider`.
2. If it takes `options`, override `configProblems()` to say when they are unusable — see
   [validation](#-validation).
3. Add one line to `providers`.
4. Nothing else. Config typing, lazy loading and the Nuxt route follow automatically.

## 🔌 The ports

```ts
interface HttpClient {
    get<T>(url: string, options?: { headers: Record<string, string> }): Promise<T>
}

abstract class TranslationProvider<T extends object = object> implements Vendor<T> {
    abstract getTranslations(locale: Locale): Promise<TranslationMap>
    protected configProblems(): string[]      // [] unless the vendor has options to check
}
```

The generic is load-bearing, not decoration: `registry.ts` reads it back off the class to decide
whether `options` is required in config or forbidden, which is what makes an invalid pair fail to
typecheck rather than fail at boot. A vendor with no options leaves it at the default.

A provider knows its vendor's URL contract but delegates all I/O to an injected `HttpClient`,
so it binds to no transport. Composition happens at the edge — the consumer builds the client
and injects it.

One thing the port deliberately hides: a failed request surfaces as an `UpstreamError`, never as a
transport-specific one. Without that the domain cannot tell "upstream said no" from "the network is
down", and a `FetchError` reaching the edge would put the vendor's URL into a `statusMessage` the
client reads.

`TranslationProvider` is abstract, so a vendor that forgets `getTranslations` fails to compile
instead of throwing at request time.

There is no service layer on top of the provider port, deliberately: a class forwarding one
call to one collaborator would add a name and a file without adding behaviour. Callers talk to
the port directly. Wrap it in a service the day something real needs to live there — locale
fallback, or merging local overrides.

## ✅ Validation

The registry types the config at compile time, but deploy-time values arrive from env vars, and
`process.env.WHATEVER ?? ""` typechecks fine. So a provider validates itself **in its
constructor**: it cannot exist misconfigured, the same way it cannot exist without a transport.
Every construction path is covered, not just `createProvider`.

Two halves, because only one of them is knowable in the core:

| Checked | Where | Rule |
| --- | --- | --- |
| `project` | `TranslationProvider` | non-empty |
| `baseURL` | `TranslationProvider` | parses as an absolute URL, so a missing scheme (`app.tolgee.io`) is caught rather than silently becoming a relative fetch |
| `options` | the provider, via `configProblems()` | whatever that vendor needs — `tolgee` requires a non-empty token |

`configProblems()` returns problems rather than throwing, so one `MisconfiguredVendorError` lists
**all** of them at once: fixing a deployment one restart per missing variable is the thing worth
avoiding. A vendor without options overrides nothing.

This is deliberately hand-written rather than a schema library. What is missing at runtime is
*value* checks on the two or three strings you wrote yourself — the *shape* is already guaranteed by
`VendorConfig`. This package has two dependencies and neither is a validator; a third would cost
more than it closes. See [deferred](#-deliberately-deferred) for when that changes.

Because it is a `TranslationsError`, it needs no wiring at the edge: it reports as a `500` naming
what is unset, instead of the vendor being blamed with a `502` for config that never arrived.

## 🧩 Framework-agnostic use

```ts
import { ofetch } from "ofetch";
import { createProvider, OfetchHttpClient } from "@monorepo/i18n";

const baseURL = process.env.TRANSLATIONS_VENDOR_BASE_URL!;

const http = new OfetchHttpClient(ofetch.create({ baseURL }));
const provider = await createProvider({ name: "internal", project: "external", baseURL }, http);

const messages = await provider.getTranslations("en-GB");
```

The transport is a constructor argument, so a provider cannot exist without one. Build it from
the config you already hold — never from the provider you are about to create.

`OfetchHttpClient` owns no transport config of its own: base URL, retries, headers and
interceptors all come from the instance you inject. On a transport that is not ofetch (axios,
plain `fetch`), write the five-line `HttpClient` for it in your own app — `HttpClient` is the
only thing the core needs.

Caching itself is **not** in the core — the Nuxt integration caches at its BFF route, and any
other consumer supplies its own. What *is* in the core is `translationsKey(vendor, locale)`: the
identity of the upstream document — the whole vendor config bar `options`, and the locale. Feed it to
whatever cache you use, so no two of those can share an entry. The vendor is hashed whole rather than
field by field, so a field added to `Vendor` cannot be forgotten here; base URL being one of them is
what stops a cache shared across environments serving staging messages in production.

Those inputs are hashed rather than listed, behind a readable `vendor_locale_` prefix. Nitro strips
every non-word character from a cached handler's key, so the key is built from word characters only —
`_` separates the parts, and both it and the `-` of base64url are escaped (`_u`, `_d`) so distinct
parts stay distinct. The key that is stored is the key that was built, and anything consuming it gets
that guarantee for free.

`options` is deliberately **not** in the key: it carries credentials, and credentials are not
identity — two tokens for the same project fetch the same document, so they should share an entry,
and a secret has no business in a cache storage path. A future vendor whose options genuinely pick
the document (a branch, an export profile) belongs on `Vendor`, not in `options`.

## ⚠️ Errors

All of them extend `TranslationsError`, so one `instanceof` catches anything the package raises.

| Error | `statusCode` | Raised when |
| --- | --- | --- |
| `UndefinedLocaleError` | 404 | the request carried no locale, or one the consumer never declared |
| `UndefinedVendorError` | 500 | config names a vendor the registry doesn't have — raised by `createProvider`, and the message lists the registered names |
| `MisconfiguredVendorError` | 500 | the vendor exists but its config cannot work — raised while constructing the provider, and `problems` lists every reason |
| `UndefinedLocaleProviderError` | 500 | the vendor answered, but not for the locale asked of it — the config claims a locale the vendor doesn't hold |
| `UpstreamError` | 502 | the transport failed. `upstreamStatus` keeps what the vendor answered, for diagnosis rather than to serve: the only caller-supplied axis is the locale and it is checked against the declared list first, so nothing upstream reports is the caller's fault. (`@monorepo/content` relays a 400 or 404 for exactly that reason — its slug *is* caller input) |
| `TranslationsUnavailableError` | 502 | the vendor failed for that locale in a way the transport did not diagnose — a broken mapping, say (original error in `cause`) |

Each error carries its own `statusCode` / `statusMessage`, so adding one never means editing a
mapping somewhere else — the route just hands it to `createError`. A non-HTTP consumer ignores
both and reads `message`.

Nothing else is dressed up as one of these. A failure the package can't diagnose — a broken
adapter, say — propagates as itself, so the route reports it as an unhandled 500 with its own
stack rather than blaming the vendor.

## 🧭 Deliberately deferred

Sized for a small monorepo. When it grows:

| Later need | What changes |
| --- | --- |
| A vendor authenticated some other way (query param, signed URL) | `HttpClient.get` only carries headers today — `tolgee` covers itself with an API key header. Widen the options bag again when a vendor needs more |
| Schema validation of vendor config or TMS responses | Construction checks values, not shapes, by hand — see [validation](#-validation). Reach for a schema library the day you validate what the TMS *sends back*: that is third-party JSON with a shape you don't control, which is a different problem from the handful of strings you wrote yourself |
| Locale fallback / merging local overrides | Nothing sits between the caller and the provider port today. That is where a service belongs — add it when there is behaviour to put in it, not before |

The `internal` vendor's translations live in the TMS at
[`infrastructure/translations/`](../../infrastructure/translations).
