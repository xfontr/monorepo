# 📦 @budget-forecast/i18n

Shared translations. A framework-agnostic core that fetches locale messages from a vendor
(a TMS), built as ports & adapters, plus an optional Nuxt module that wires it up in one
config block.

Two entry points, kept apart by the `exports` map:

| Import | Contains | Depends on |
| --- | --- | --- |
| `@budget-forecast/i18n` | domain, ports, service, adapters, vendor registry | `ofetch` |
| `@budget-forecast/i18n/nuxt` | the Nuxt module and its runtime files — see [src/nuxt/README.md](./src/nuxt/README.md) | `@nuxt/kit`, `@nuxtjs/i18n` |

A React, Vue or plain Node consumer resolves the first and can never reach the second, so
nothing framework-specific leaks. That is enforced by module resolution, not discipline.

## 🗂 Structure

```
src/
├── index.ts                                  # the public API — the only surface consumers import
├── core/
│   ├── domain/
│   │   ├── translations.ts                   # Locale, TranslationMap
│   │   ├── Vendor.ts                         # vendor config shape
│   │   └── TranslationService.ts             # use case
│   ├── ports/
│   │   ├── HttpClient.ts                     # driven port: the transport
│   │   └── TranslationProvider.ts            # driven port: a vendor
│   ├── adapters/
│   │   ├── OfetchHttpClient.ts               # HttpClient over an injected ofetch instance
│   │   ├── TranslationsInternalProvider.ts   # the `internal` vendor (our own mock TMS)
│   │   └── TestProvider.ts                   # `test` vendor — exists to exercise vendor options
│   ├── errors.ts                             # what can go wrong, with an HTTP status attached
│   └── registry.ts                           # vendor name → provider, and the config type
└── nuxt/                                     # the Nuxt module (separate entry point)
```

## 🏷 Vendors

A vendor is one entry in [`core/registry.ts`](./src/core/registry.ts). The registry is the
single source of truth: it drives both the runtime lookup and the config type, so config and
code cannot drift.

```ts
const registry = {
    internal: () => import("./adapters/TranslationsInternalProvider"),
    test: () => import("./adapters/TestProvider"),
};
```

`VendorConfig` is derived from it. Each vendor's `options` field is read off its provider
class, so a vendor that needs options makes them **required** in config, and a vendor that
needs none **forbids** them:

```ts
{ name: "internal", project: "external", baseURL }              // options not allowed
{ name: "test", project: "external", baseURL, options: { id } } // options required
```

Adding a vendor:

1. Write `core/adapters/<Name>Provider.ts` extending `TranslationProvider`, overriding
   `getTranslations` with that vendor's URL contract.
2. Add one line to `registry`.
3. Nothing else. Config typing, lazy loading and the Nuxt route follow automatically.

## 🔌 The ports

```ts
interface HttpClient {
    get<T>(url: string): Promise<T>
}

class TranslationProvider {
    getTranslations(locale: Locale): Promise<TranslationMap>
}
```

`TranslationService` knows only a `TranslationProvider`. A provider knows its vendor's URL
contract but delegates all I/O to an injected `HttpClient`, so it binds to no transport.
Composition happens at the edge — the consumer builds the client and injects it.

## 🧩 Framework-agnostic use

```ts
import { ofetch } from "ofetch";
import { getVendor, OfetchHttpClient, TranslationService } from "@budget-forecast/i18n";

const baseURL = process.env.TMS_BASE_URL!;

const provider = await getVendor({ name: "internal", project: "external", baseURL });
provider.setHttpClient(new OfetchHttpClient(ofetch.create({ baseURL })));

const messages = await new TranslationService(provider).load("en-EN");
```

`OfetchHttpClient` owns no transport config of its own: base URL, retries, headers and
interceptors all come from the instance you inject. On a transport that is not ofetch (axios,
plain `fetch`), write the five-line `HttpClient` for it in your own app — `HttpClient` is the
only thing the core needs.

Note that caching is **not** in the core. The Nuxt integration caches at its BFF route; any
other consumer supplies its own.

## ⚠️ Errors

All three extend `TranslationsError`, so one `instanceof` catches anything the package raises.

| Error | `statusCode` | Raised when |
| --- | --- | --- |
| `UndefinedLocaleError` | 404 | the request carried no locale |
| `UndefinedVendorError` | 500 | config names a vendor the registry doesn't have — raised by `getVendor`, and the message lists the registered names |
| `TranslationsUnavailableError` | 502 | the vendor failed for that locale (original error in `cause`) |

`statusCode` / `statusMessage` exist because the only consumer today is an H3 route, which
maps them straight onto the response. A non-HTTP consumer should ignore both and read
`message`.

Nothing else is dressed up as one of these. A failure the package can't diagnose — a broken
adapter, say — propagates as itself, so the route reports it as an unhandled 500 with its own
stack rather than blaming the vendor.

## 🧭 Deliberately deferred

Sized for a small monorepo. When it grows:

| Later need | What changes |
| --- | --- |
| An authenticated vendor | `HttpClient.get` takes no headers or params yet, and the transport is built by the consumer *before* the provider — so today the first paid TMS forces a change at the composition root. Fix that before adding vendor #2 |
| Confidence when swapping vendors | There are no tests. `getVendor`, each provider's URL shape and the config typing are all pure and cheap to cover |
| Runtime config validation | The typing above is compile-time only; deploy-time values arrive from env vars unchecked |
| Locale fallback / merging local overrides | `TranslationService` is a pass-through today; it is where that belongs |

The `internal` vendor's translations live in the mock TMS at
[`infrastructure/translations/`](../../infrastructure/translations).
