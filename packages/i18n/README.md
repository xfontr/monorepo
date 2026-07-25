# 📦 @budget-forecast/i18n

The app-side **translation core**, built as **ports & adapters (hexagonal)**. The
core depends only on its own `domain/` and `ports/`; where translations come from
(our infra today, a real TMS like Localise tomorrow) and how HTTP is spoken (fetch,
ofetch, axios) are adapter details injected inward at the app's composition root.

## 🗂 Structure

```
src/
├── domain/translations.ts              # pure types: Locale, TranslationMap
├── ports/http-client.port.ts           # driven port: HttpClient
├── ports/translation-provider.port.ts  # driven port: TranslationProvider
├── adapters/translations-server.provider.ts  # infra/translations/server adapter
├── application/translation.service.ts  # use case: TranslationService
└── index.ts
```

The core has **zero runtime dependency** on any HTTP library.

## 🔌 The ports

```ts
interface TranslationProvider {
    getTranslations(locale): Promise<TranslationMap>;
}

interface HttpClient {
    get<T>(url, opts?: { params }): Promise<T>;
}
```

`TranslationService` (the use case) knows only `TranslationProvider`. A provider
adapter (e.g. `TranslationsServerProvider`) knows a source's URL contract but
delegates all I/O to an injected `HttpClient`, so it binds to no transport.

## 🧩 Composition root (app-side)

The concrete HTTP client and the provider choice are wired **in the app**, never
in the core. The external (Nuxt) app injects an ofetch-based client:

```ts
import { TranslationService, TranslationsServerProvider } from "@budget-forecast/i18n";
import { OfetchHttpClient } from "./adapters/ofetch-http-client";

const http = new OfetchHttpClient();
const provider = new TranslationsServerProvider(http, tmsBaseUrl, "external");
//    ^ future swap: new LocaliseProvider(http, LOCALISE_KEY) — one line, zero core changes

export const i18n = new TranslationService(provider);
```

## 🧱 Extending

| Later need | What you add | What you must NOT touch |
| --- | --- | --- |
| Localise provider | `adapters/localise.provider.ts` implementing `TranslationProvider` + one export line in `index.ts` | domain, ports, service, external app |
| Internal app (axios) | `apps/internal/adapters/axios-http-client.ts` implementing `HttpClient` + its own composition root | everything in `packages/i18n` |

The infra adapter's translations live in the mock TMS at
[`infrastructure/translations/`](../../infrastructure/translations) (`@budget-forecast/translations`).
