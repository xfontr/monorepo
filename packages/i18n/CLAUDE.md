# 🤖 @monorepo/i18n

See [README.md](./README.md) — it documents the vendors, the ports and the tradeoffs in full. Use the
`i18n:new-vendor` skill when adding a TMS.

The invariants worth losing a build over:

- **Nothing under `src/core/` may import `@nuxt/kit` or `@nuxtjs/i18n`.** `ofetch` and `ohash` are the
  package's only real dependencies; everything the Nuxt entry point needs is an **optional peer
  dependency**. Never promote one.
- Use the `#core/*` and `#nuxt/*` subpath imports, never `../../`.
- `baseURL` and `project` are validated in `TranslationProvider` for every vendor. A provider only
  overrides `optionProblems()`, only for its own `options`, and only reading `this.options` — it runs
  from the base constructor, before the subclass's field initialisers.
- Problems are returned as strings and collected, never thrown one at a time. Fixing a deployment one
  restart per missing env var is the thing being avoided.
- Validation is hand-written on purpose. Adding a schema library to a package with two dependencies
  costs more than it closes — the README argues it out; read that before reaching for zod.
- URLs are relative here: the consumer builds the client with `ofetch.create({ baseURL })`.
- No service layer over the port. Locale fallback or merging local overrides would be the day that
  changes.

Tagged `type:i18n`, so it may depend only on `@monorepo/configs`.

[`runtime/locales/loader.ts`](./src/nuxt/runtime/locales/loader.ts) is one line on purpose. It hands
the failure to the BFF route, which already maps every `TranslationsError` to a status — a
`try`/`catch` or a `showError` branch here would only bury that.
