# 📦 @budget-forecast/i18n

Shared translations. A framework-agnostic core that fetches locale messages from a vendor
(a TMS), built as ports & adapters, plus an optional Nuxt module that wires it up in one
config block.

Two entry points, kept apart by the `exports` map:

| Import | Contains | Depends on |
| --- | --- | --- |
| `@budget-forecast/i18n` | domain, ports, adapters, vendor registry | `ofetch` |
| `@budget-forecast/i18n/nuxt` | the Nuxt module and its runtime files — see [src/nuxt/README.md](./src/nuxt/README.md) | `@nuxt/kit`, `@nuxtjs/i18n` |

A React, Vue or plain Node consumer resolves the first and can never reach the second, so
nothing framework-specific leaks. That is enforced by module resolution, not discipline.

Everything the second entry point needs is an **optional peer dependency**, so resolving the
first installs none of it. Only `ofetch` is a real dependency. If a non-Nuxt consumer ever
ships to production, split the Nuxt half into its own package — a package that is a Nuxt
module is allowed to depend on `@nuxt/kit` outright, and the optional-peer trick only holds
while every consumer lives in this workspace.

## 🗂 Structure

```
src/
├── index.ts                                  # the public API — the only surface consumers import
├── core/
│   ├── domain/
│   │   ├── translations.ts                   # Locale, TranslationMap
│   │   └── Vendor.ts                         # vendor config shape
│   ├── ports/
│   │   ├── HttpClient.ts                     # driven port: the transport
│   │   └── TranslationProvider.ts            # driven port: a vendor
│   ├── adapters/
│   │   ├── clients/
│   │   │   └── OfetchHttpClient.ts           # HttpClient over an injected ofetch instance
│   │   └── providers/
│   │       ├── InternalProvider.ts           # the `internal` vendor (our own mock TMS)
│   │       └── TestProvider.ts               # `test` vendor — exists to exercise vendor options
│   ├── errors.ts                             # what can go wrong, with an HTTP status attached
│   ├── translationsKey.ts                    # which upstream document a request resolves to
│   └── registry.ts                           # vendor name → provider, and the config type
└── nuxt/                                     # the Nuxt module (separate entry point)
```

## 🏷 Vendors

A vendor is one entry in [`core/registry.ts`](./src/core/registry.ts). The registry is the
single source of truth: it drives both the runtime lookup and the config type, so config and
code cannot drift.

```ts
const providers = {
    internal: () => import("./adapters/providers/InternalProvider"),
    test: () => import("./adapters/providers/TestProvider"),
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

1. Write `core/adapters/providers/<Name>Provider.ts` extending `TranslationProvider`, overriding
   `getTranslations` with that vendor's URL contract. File, class and registry key all carry the
   same `<Name>` — `internal` → `InternalProvider.ts` → `class InternalProvider`.
2. Add one line to `providers`.
3. Nothing else. Config typing, lazy loading and the Nuxt route follow automatically.

## 🔌 The ports

```ts
interface HttpClient {
    get<T>(url: string): Promise<T>
}

abstract class TranslationProvider {
    abstract getTranslations(locale: Locale): Promise<TranslationMap>
}
```

A provider knows its vendor's URL contract but delegates all I/O to an injected `HttpClient`,
so it binds to no transport. Composition happens at the edge — the consumer builds the client
and injects it.

`TranslationProvider` is abstract, so a vendor that forgets `getTranslations` fails to compile
instead of throwing at request time.

There is no service layer on top of the provider port, deliberately: a class forwarding one
call to one collaborator would add a name and a file without adding behaviour. Callers talk to
the port directly. Wrap it in a service the day something real needs to live there — locale
fallback, or merging local overrides.

## 🧩 Framework-agnostic use

```ts
import { ofetch } from "ofetch";
import { createProvider, OfetchHttpClient } from "@budget-forecast/i18n";

const baseURL = process.env.TMS_BASE_URL!;

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
other consumer supplies its own. What *is* in the core is `translationsKey(vendor, locale)`:
the identity of the upstream document, covering every input that picks it — vendor, project, base
URL, options, locale. Feed it to whatever cache you use, so no two of those can share an entry.
Base URL is in there so that a cache shared across environments cannot serve staging messages in
production.

## ⚠️ Errors

All three extend `TranslationsError`, so one `instanceof` catches anything the package raises.

| Error | `statusCode` | Raised when |
| --- | --- | --- |
| `UndefinedLocaleError` | 404 | the request carried no locale |
| `UndefinedVendorError` | 500 | config names a vendor the registry doesn't have — raised by `createProvider`, and the message lists the registered names |
| `TranslationsUnavailableError` | 502 | the vendor failed for that locale (original error in `cause`) |

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
| An authenticated vendor | `HttpClient.get` takes no headers or params yet, so credentials can only reach the vendor baked into the transport at the composition root. Widen the port before adding vendor #2 |
| Runtime config validation | The typing above is compile-time only; deploy-time values arrive from env vars unchecked |
| Locale fallback / merging local overrides | Nothing sits between the caller and the provider port today. That is where a service belongs — add it when there is behaviour to put in it, not before |

The `internal` vendor's translations live in the mock TMS at
[`infrastructure/translations/`](../../infrastructure/translations).
