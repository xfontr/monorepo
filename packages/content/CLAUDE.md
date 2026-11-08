# 🤖 @monorepo/content

See [README.md](./README.md) — it documents the domain, the ports and the tradeoffs in full. Use the
`content-new-vendor` skill when adding a CMS.

The invariants worth losing a build over:

- **Nothing under `src/core/` may import the Nuxt or Nitro runtime**
  ([the enforced list](../configs/README.md#-what-the-eslint-factories-bundle)), and `src/core/domain/`
  imports nothing at all. The day that breaks, the core stops being portable and the ports stop
  earning their indirection.
- The Nuxt half is a separate entry point (`@monorepo/content/nuxt`) and its dependencies are
  **optional peer dependencies**. Never promote one to a real dependency — a non-Nuxt consumer would
  start installing it.
- Use the `#core/*` and `#nuxt/*` subpath imports, never `../../`.
- The vendor contract is `@monorepo/i18n`'s: keep the two matching, and change both or neither.
  `baseURL` is validated in `ContentProvider` for every vendor. A provider only overrides
  `configProblems()`, only for its own `options`, and only reading `this.options` — it runs from the
  base constructor, before the subclass's field initialisers. `core/ports/ContentProvider.spec.ts`
  pins it.
- `options` carries credentials and nothing else, and stays out of the cache key. Whatever picks the
  document belongs in `baseURL`.
- URLs are relative: the consumer builds the client with `ofetch.create({ baseURL })`.
- A vendor's shapes never leave its adapter. Ids are strings, always.
- A query axis the vendor can't serve is refused with a 400, never dropped silently: the result
  would be cached under the value that was asked for. No axis needs this today, so there is no
  error class for it — add one with the axis.
- Apply the `MAX_PAGE` / `MAX_PER_PAGE` / `MAX_SEARCH_LENGTH` ceilings **before** building a cache
  key, so a crafted query can't mint unbounded entries.
- `statusMessage` reaches the client, so no error message may repeat the vendor's URL or the
  transport's own message.
- No service layer over the provider port, and no caching in the core — the Nuxt half's `useContent`
  caches, other consumers bring their own.

Tagged `type:integration`, so it may depend only on `@monorepo/configs`. That is why nothing here
emits a span; instrument from the consuming app.
