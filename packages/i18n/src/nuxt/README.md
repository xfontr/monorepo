# 🟢 @budget-forecast/i18n/nuxt

The Nuxt integration for [`@budget-forecast/i18n`](../../README.md). One config block installs
and configures `@nuxtjs/i18n`, registers a locale loader, and mounts a cached BFF route that
proxies the vendor — so the TMS base URL (and, later, its credentials) never reach the client.

## 🚀 Usage

```ts
export default defineNuxtConfig({
    modules: ["@budget-forecast/i18n/nuxt"],

    translations: {
        vendor: {
            name: "internal",
            project: "external",
            baseURL: process.env.TMS_BASE_URL ?? "http://localhost:4000",
        },
    },

    i18n: {
        defaultLocale: "en-EN",
        locales: [
            { code: "en-EN", name: "English (UK)" },
            { code: "es-ES", name: "Spanish (ES)" },
        ],
    },
});
```

Locales are declared under `i18n`, not under `translations` — the module reads them from there
(across layers) and registers a loader for each. Everything else you set under `i18n`
(`strategy`, `detectBrowserLanguage`…) stays yours.

### Options

`translations.vendor` is a `VendorConfig` — see [vendors](../../README.md#-vendors). `name`
picks the vendor from the registry, and the shape of the rest follows from that name, so an
invalid combination fails to typecheck in `nuxt.config`.

Only `vendor` reaches `runtimeConfig` (server-side, not `public`), because it is what the BFF
route needs per request. Override the base URL per deployment with
`NUXT_TRANSLATIONS_VENDOR_BASE_URL`. Everything else is resolved at build time.

## 🧱 The two halves

```
module.ts                       # build-time: runs in Node during the consumer's build (@nuxt/kit)
config.ts                       # the contract between both halves: the API path and the config shape
runtime/
├── locales/loader.ts            # the @nuxtjs/i18n locale loader, compiled by the consumer's Vite
└── server/translations.get.ts   # the cached BFF route, compiled by the consumer's Nitro
```

`module.ts` and `runtime/**` are separate runtimes. Never import across that line except with
`import type` — anything shared at value level (like `TRANSLATIONS_API_PATH`) goes in
`config.ts`.

`TranslationsConfig` lives there too, and is the module's options type *and* the shape the route
asserts on `runtimeConfig`. The route has to assert it: Nuxt regenerates
`runtimeConfig.translations` from the literal in `nuxt.config`, widening `name` from
`"internal"` to `string` and losing the discriminated union. A `declare module "nitropack/types"`
inside this package does not fix that — the consumer's Nitro build never imports `config.ts`, so
the augmentation isn't in its program. Closing it properly means `addTypeTemplate` in `setup()`,
writing the augmentation into the consumer's `.nuxt/`.

## 🔁 The request path

```
$t("meta.title")
  → @nuxtjs/i18n calls runtime/locales/loader.ts
    → GET /api/translations/:locale          (runtime/server/translations.get.ts, cached)
      → createProvider(vendor, http) → provider.getTranslations(locale)
        → GET :baseURL/:locale/:project      (the TMS)
```

Two things are fixed rather than configurable, because both are internal contracts between the
halves: the API path (`/api/translations`) and the cache window (`maxAge` 1h, `staleMaxAge` 24h,
bypassed in dev). Override the cache from `nuxt.config` with a nitro route rule if a deployment
ever needs to. The cache key comes from `translationsKey` in the core, not from this route —
`vendor:project:options:locale`, every input that picks the upstream document, so changing any
of them can't serve stale messages from the previous one (`options` is omitted for vendors that
declare none). It lives in the core so a non-Nuxt consumer caching the same documents keys them
the same way instead of reinventing it.

## 🚫 Do not "fix" the loader

[`runtime/locales/loader.ts`](./runtime/locales/loader.ts) is correct as written. Two parts of
it read as suspicious and are not:

- **`useFetch`** — it works here, including production SSR inside Nitro. Do not swap it for
  `$fetch`.
- **the `showError` error branch** — it returns `showError(...)` rather than throwing. This has
  been "corrected" repeatedly and each time it was wrong. Leave it.

Both are load-bearing behaviour confirmed against a real deployment. If a static reading of the
types suggests otherwise, the types are the thing that's wrong.

## ⚠️ Gotchas

- **Don't list `@nuxtjs/i18n` in `modules` yourself.** This module installs it, *after*
  registering the loader — installing it first would let its defaults win over the derived
  locale config.
- **Set `i18n.defaultLocale`.** The module doesn't. `@nuxtjs/i18n` defaults to the
  `prefix_except_default` strategy, so without it every path is prefixed and `/` returns 404.
- **`:locale` is not validated against the configured locales.** Any string is forwarded to the
  vendor and cached under its own key. Fine behind one known app; worth closing before the route
  faces anything untrusted.
- **The vendor config isn't checked at build time.** Omit `translations` and the failure shows up
  as a `500` from the route at request time rather than a build error.
