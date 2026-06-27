# 📦 @budget-forecast/i18n

Shared locale translations. Exposes the path pointing to each translation.

## 🚀 Usage example for Nuxt i18n

```ts
import { en } from "@budget-forecast/i18n";

export default defineNuxtConfig({
    i18n: {
        // This use case leverages i18n's lazy-loading. The client will request only the locale being used.
        locales: [{ code: "en", name: "English", files: [en, "en.json"] }],
    },
});
```
