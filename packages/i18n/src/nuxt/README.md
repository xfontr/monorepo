# 🟢 @monorepo/i18n/nuxt

The Nuxt integration for [`@monorepo/i18n`](../../README.md). One config block installs
and configures `@nuxtjs/i18n`, registers a locale loader, and mounts a cached BFF route that
proxies the vendor — so the TMS base URL (and, later, its credentials) never reach the client.

## 🚀 Usage

```ts
export default defineNuxtConfig({
    modules: ["@monorepo/i18n/nuxt"],

    translations: {
        vendor: {
            name: "internal",
            project: "external",
            baseURL: process.env.TRANSLATIONS_VENDOR_BASE_URL ?? "http://localhost:4000",
        },
    },

    i18n: {
        defaultLocale: "en-GB",
        locales: [
            { code: "en-GB", name: "English (UK)" },
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

`runtimeConfig` (server-side, not `public`) carries what the BFF route needs per request: `vendor`,
plus the `locales` the module derived from `i18n.locales` so the route can reject anything else.
Override the base URL per deployment with `NUXT_TRANSLATIONS_VENDOR_BASE_URL`. Everything else is
resolved at build time.

You do not write `locales` yourself — it is derived. It sits on `TranslationsConfig`, which is also
the module's options type, so it *appears* settable in `nuxt.config`; the module overwrites it with
the derived list. Declare locales under `i18n`, as above.

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
asserts on `runtimeConfig`. Those two roles have drifted slightly: `locales` belongs only to the
second, so the options type advertises a field the consumer must not set. Split it in two the day
a second derived field shows up. The route has to assert it: Nuxt regenerates
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
      → :locale must be one of runtimeConfig.translations.locales, or 404
      → createProvider(vendor, http) → provider.getTranslations(locale)
        → GET :baseURL/:locale/:project      (the TMS)
```

Two things are fixed rather than configurable, because both are internal contracts between the
halves: the API path (`/api/translations`) and the cache window (`maxAge` 1h, `staleMaxAge` 24h,
bypassed in dev). Override the cache from `nuxt.config` with a nitro route rule if a deployment
ever needs to. The cache key comes from `translationsKey` in the core, not from this route —
`vendor:project:baseURL:locale`, every input that picks the upstream document, so changing any of
them can't serve stale messages from the previous one (vendor `options` are credentials, not
identity, and are deliberately excluded). It lives in the core so a non-Nuxt consumer caching the
same documents keys them the same way instead of reinventing it.

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
- **`:locale` is matched exactly against the declared locales.** `en-gb` is not `en-GB` — it 404s.
  The loader always sends the codes you declared, so this only bites a hand-written request.
- **The vendor config is checked at request time, not build time.** It has to be: `baseURL` can be
  replaced at runtime by `NUXT_TRANSLATIONS_VENDOR_BASE_URL`, so the values present during the build
  are not necessarily the deployed ones. Unset config fails on the first translation request with a
  `500` naming what is missing — see [validation](../../README.md#-validation) — rather than at
  build time.
