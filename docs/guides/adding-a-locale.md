# 🌍 Adding a locale

Two files change, in two different projects, and neither README mentions the other's half. This
guide is the whole task; each project's README covers only its own step.

## 1. Add the messages file

```
infrastructure/translations/projects/<project>/<locale>.json
```

Locale files are hand-edited JSON, served as-is — there's no build step or generation for them. See
[`infrastructure/translations/README.md`](../../infrastructure/translations/README.md) for the
message shape and how the service reads it (`readLocale()` re-reads from disk on every request, so
a running local instance picks up the new file without a restart).

## 2. Declare the locale in the app

```ts
// apps/<app>/nuxt.config.ts
i18n: { locales: ["en-GB", "es-ES", "<new-locale>"], defaultLocale: "en-GB" }
```

`@monorepo/i18n`'s Nuxt module ([`module.ts`](../../packages/i18n/src/nuxt/module.ts)) reads this
array at build time — it's the single source both `@nuxtjs/i18n` and the BFF route
(`/api/translations/:locale`) get their locale list from, so there's no separate list to keep in
sync. It collects locales across every Nuxt layer and accepts either a string or a
`{ code }` object.

The two steps fail in opposite directions, and neither is loud:

| Skipped | What happens |
| --- | --- |
| Step 2 | Step 1's file exists but is unreachable — nothing declares the locale, so no loader is registered for it and no route serves it |
| Step 1 | The build says nothing: the module only checks the *config*, never whether a messages file exists. It surfaces on the first request for that locale, when the vendor answers 404 — see the [error table](../../packages/i18n/README.md#-errors) for how that maps |

The only build-time warnings the module emits are about config: no locales declared at all, or a
`defaultLocale` that isn't one of the declared locales. Neither fires for a missing messages file.

## What doesn't need to change

`Locale` in `@monorepo/i18n` (`packages/i18n/src/core/domain/translations.ts`) is `type Locale =
string` — there's no enum or union to extend. Any string the app declares in step 2 is already a
valid `Locale`; the only place that actually enumerates "which locales exist" is the array in step
2 itself.

## 🧭 Deliberately deferred

| Later need | What changes |
| --- | --- |
| A locale declared in one app but not others | Each app's `i18n.locales` is independent already — nothing to change, this is the existing behavior |
| Validating a locale file's keys against the default locale's | Not enforced today; a missing key falls through to whatever `@nuxtjs/i18n`'s fallback does, not caught at add-time |
