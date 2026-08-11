# 📦 @budget-forecast/i18n

The **translation core**, built as **ports & adapters (hexagonal)**, plus an optional
Nuxt module that wires the whole thing up in one config block.

Two entry points, kept apart by the exports map:

| Import | Contains | Depends on |
| --- | --- | --- |
| `@budget-forecast/i18n` | domain, ports, service, HTTP/provider adapters | `ofetch` (types only) |
| `@budget-forecast/i18n/nuxt` | the Nuxt module and its runtime files | `@nuxt/kit`, `@nuxtjs/i18n` |

A Vue, Angular or plain Node consumer resolves the first and can never reach the second,
so nothing framework-specific leaks. That is enforced by module resolution, not discipline.

## 🗂 Structure

```
src/
├── domain/translations.ts                    # pure types: Locale, TranslationMap
├── ports/HttpClient.ts                       # driven port: HttpClient
├── ports/TranslationProvider.ts              # driven port: TranslationProvider
├── adapters/OfetchHttpClient.ts              # HttpClient over an injected ofetch instance
├── adapters/TranslationsServerProvider.ts    # infrastructure/translations adapter
├── application/TranslationService.ts         # use case: TranslationService
├── index.ts
└── nuxt/
    ├── module.ts                             # build-time: @nuxt/kit
    └── runtime/                              # shipped into the consumer's bundle
        ├── locales/loader.ts                 # the @nuxtjs/i18n dynamic locale loader
        └── server/translations.get.ts        # cached /api/translations/:locale route
```

`module.ts` runs in Node during the consumer's build; `runtime/**` is compiled by the
consumer's Vite and Nitro. They are separate runtimes — never import across that line
except with `import type`.

## 🔌 The ports

```ts
interface TranslationProvider {
    getTranslations(locale): Promise<TranslationMap>;
}

interface HttpClient {
    get<T>(url, opts?: { params }): Promise<T>;
}
```

`TranslationService` knows only `TranslationProvider`. A provider adapter knows a source's
URL contract but delegates all I/O to an injected `HttpClient`, so it binds to no transport.

## 🧩 Framework-agnostic use

```ts
import { OfetchHttpClient, TranslationService, TranslationsServerProvider } from "@budget-forecast/i18n";

const http = new OfetchHttpClient(ofetch.create({ baseURL: tmsBaseURL }));
//                                ^ your app's own instance — Nuxt's `$fetch`, a configured
//                                  ofetch with interceptors, whatever you already have

const provider = new TranslationsServerProvider(http, "external");
//    ^ future swap: new LocaliseProvider(http, LOCALISE_KEY) — one line, zero core changes

const messages = await new TranslationService(provider).load("en-EN");
```

`OfetchHttpClient` owns no transport config of its own: base URL, retries, headers and
interceptors all come from the instance you inject. On a transport that is not ofetch
(axios, plain `fetch`), write the five-line `HttpClient` for it in your own app.

## 🟢 Nuxt use

```ts
export default defineNuxtConfig({
    modules: ["@budget-forecast/i18n/nuxt"],

    translations: {
        project: "external",
        tmsBaseURL: process.env.TMS_BASE_URL,
        locales: [
            { code: "en-EN", name: "English (UK)" },
            { code: "es-ES", name: "Spanish (ES)" },
        ],
    },
});
```

That single block installs and configures `@nuxtjs/i18n`, registers the locale loader,
and mounts a cached `/api/translations/:locale` route that proxies the provider. Do **not**
list `@nuxtjs/i18n` in `modules` yourself — the module installs it, and installing it first
would let its defaults win over the ones derived from `locales`.

### Options

| Option | Default | |
| --- | --- | --- |
| `project` | — | required; project key asked of the provider |
| `locales` | — | required; at least one entry, the first being the default locale |
| `tmsBaseURL` | `""` | also settable at deploy time via `NUXT_TRANSLATIONS_TMS_BASE_URL` |

Anything you set under `i18n` in `nuxt.config` still wins, so `strategy`,
`detectBrowserLanguage` and friends stay yours.

Two things are deliberately fixed rather than configurable, because both are internal
contracts between the module's two halves: the API path (`/api/translations`) and the
cache window (`maxAge` 1h, `staleMaxAge` 24h, bypassed in dev). Override the cache from
`nuxt.config` with a nitro route rule if a deployment ever needs to.

Only `tmsBaseURL` and `project` reach `runtimeConfig` — they are what the server route
needs per request, and `tmsBaseURL` has to be settable per deployment. Everything else
is resolved at build time.

### Why the loader avoids Nuxt composables

For production SSR `@nuxtjs/i18n` runs locale loaders **inside Nitro**, behind its own
`/_i18n/:hash/:locale/messages.json` route — not in the Nuxt app. So the loader can only
use globals both runtimes share (`$fetch`); `useFetch`, `useNuxtApp` and `showError` are
undefined there and fail at request time, not at build time.

## 🧱 Extending

| Later need | What you add | What you must NOT touch |
| --- | --- | --- |
| Localise provider | `adapters/LocaliseProvider.ts` implementing `TranslationProvider` + one export line in `index.ts` | domain, ports, service, consumers |
| Axios transport | an `HttpClient` in the consuming app + its own composition root | everything in `packages/i18n` |
| Different ofetch config | pass a different `ofetch.create({ ... })` at the composition root | the adapter |
| Another framework | a sibling entry point (`./vue`, `./angular`) beside `./nuxt` | the core entry point |

The provider's translations live in the mock TMS at
[`infrastructure/translations/`](../../infrastructure/translations) (`@budget-forecast/translations`).
