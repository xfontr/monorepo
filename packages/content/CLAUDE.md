# 🤖 @monorepo/content

See [README.md](./README.md) — it documents the domain, the ports and the tradeoffs in full. Use the
`content:new-vendor` skill when adding a CMS.

The invariants worth losing a build over:

- **Nothing under `src/core/` may import `@nuxt/kit`, `h3` or `nitropack`**, and `src/core/domain/`
  imports nothing at all. The day that breaks, the core stops being portable and the ports stop
  earning their indirection.
- The Nuxt half is a separate entry point (`@monorepo/content/nuxt`) and its dependencies are
  **optional peer dependencies**. Never promote one to a real dependency — a non-Nuxt consumer would
  start installing it.
- Use the `#core/*` and `#nuxt/*` subpath imports, never `../../`.
- `configProblems()` is called from the base constructor, so an override may only read `config` — a
  subclass's own field initialisers have not run yet. `core/ports/ContentProvider.spec.ts` pins it.
- A vendor's shapes never leave its adapter. Ids are strings, always.
- A query axis the vendor can't serve throws `UnsupportedQueryError`. Never drop it silently: the
  result would be cached under the value that was asked for.
- Apply the `MAX_PAGE` / `MAX_PER_PAGE` / `MAX_SEARCH_LENGTH` ceilings **before** building a cache
  key, so a crafted query can't mint unbounded entries.
- `statusMessage` reaches the client, so no error message may repeat the vendor's URL or the
  transport's own message.
- No service layer over the provider port, and no caching in the core — the Nuxt route caches, other
  consumers bring their own.

Tagged `type:content`, so it may depend only on `@monorepo/configs`. That is why nothing here emits
a span; instrument from the app.
