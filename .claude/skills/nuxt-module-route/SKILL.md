---
name: nuxt-module-route
description: Add a BFF route or a composable to the Nuxt half of @monorepo/content or @monorepo/i18n — the cached handler, the path and TTL consts, the module registration and the spec. Use when adding, changing or caching a server route inside a package's src/nuxt/runtime, or when exposing one to the app through a composable.
---

# Adding a route to a package's Nuxt module

The `*:new-vendor` skills stop at `src/core/`. This is the other half: five files that have to agree,
spread across three directories, where the two that live outside `runtime/server/` are the ones that
get missed.

[`@monorepo/content`](../../../packages/content/src/nuxt) is the fuller of the two modules — two
routes and a composable. [`@monorepo/i18n`](../../../packages/i18n/src/nuxt) has one route and a
locale loader. Read whichever is closer to what you are adding; they agree on everything below.

## The files

```
src/nuxt/config.ts                       the path const, the TTL consts, the RuntimeConfig augmentation
src/nuxt/module.ts                       addServerHandler / addImports
src/nuxt/runtime/server/<name>.get.ts    defineCachedEventHandler + getKey
src/nuxt/runtime/server/<name>.get.spec.ts
src/nuxt/runtime/composables/<name>.ts   only if the app needs a typed caller
```

## 1. The path and the TTLs are consts, not literals

Everything that names the route imports it from
[`config.ts`](../../../packages/content/src/nuxt/config.ts) — the module registering the handler and
the composable calling it. That is the only thing stopping the two from drifting, and
[`useContent.spec.ts`](../../../packages/content/src/nuxt/runtime/composables/useContent.spec.ts)
pins it deliberately.

```ts
export const CONTENT_API_PATH = "/api/content";

export const LIST_MAX_AGE = 60 * 60;
export const LIST_STALE_MAX_AGE = 60 * 60 * 24;
```

Nitro reads a handler's cache options when the module loads, so a TTL cannot vary per request or per
resource — a genuinely different TTL means a different route. The comment in `config.ts` says so;
don't work around it with a conditional inside `getKey`.

## 2. Two places declare the runtime config

`module.ts` assigns it and `config.ts` augments the schema. Both, or the handler reads `undefined`:

```ts
nuxt.options.runtimeConfig.content = resolvedOptions;
```

```ts
declare module "@nuxt/schema" {
    interface RuntimeConfig {
        content: ContentConfig
    }
}
```

Runtime reads it back through a cast, and
[`request.ts`](../../../packages/content/src/nuxt/runtime/server/request.ts) explains why that cast
is load-bearing rather than decoration: the augmentation only lands inside a Nuxt project, so
compiled standalone the value is `any`.

## 3. Register with the resolver, never a bare path

```ts
const resolver = createResolver(import.meta.url);

addServerHandler({
    route: `${CONTENT_API_PATH}/:resource`,
    method: "get",
    handler: resolver.resolve("./runtime/server/content.get"),
});

addImports({ name: "useContent", from: resolver.resolve("./runtime/composables/useContent") });
```

Validate what can fail the build in `setup` rather than on the first request — `content`'s module
rejects an unknown vendor name there, and says in a comment why `baseURL` is *not* checked alongside
it.

## 4. The cache options, and the one rule inside them

```ts
const cacheOptions: CachedEventHandlerOptions<ContentPage> = {
    name: "content-list",
    group: "content",
    maxAge: LIST_MAX_AGE,
    staleMaxAge: LIST_STALE_MAX_AGE,
    getKey,
    shouldBypassCache: () => import.meta.dev === true,
};
```

**`getKey` builds from the parsed query, never the raw one.** Parsing applies the defaults and the
`MAX_PAGE` / `MAX_PER_PAGE` / `MAX_SEARCH_LENGTH` ceilings first, so `?page=1`, `?page=01` and no
page at all collapse to one entry instead of three — and a crafted query cannot mint unbounded ones.
[`content.get.ts`](../../../packages/content/src/nuxt/runtime/server/content.get.ts) and
[`contentKey.ts`](../../../packages/content/src/core/contentKey.ts) are the pattern.

## 5. Errors map at this edge and nowhere else

The core throws domain errors; this layer is the only place they become HTTP statuses.

| Helper | When |
| --- | --- |
| `rethrowAsHttpError(cause)` | anything the core already diagnosed — a non-domain error keeps its stack and reports as unhandled |
| `throwUnavailableError(cause, resource)` | a provider call that failed; an `UpstreamError` already carries its status and passes through untouched rather than flattening to 502 |

`statusMessage` reaches the client, so no message may repeat the vendor's URL or the transport's own
text. Both packages carry this trio verbatim — copy it, don't re-derive it.

## 6. The spec

Mock `nitropack/runtime` so `defineCachedEventHandler` hands you the options object back; that is how
`getKey` gets tested directly rather than through a live cache.
[`translations.get.spec.ts`](../../../packages/i18n/src/nuxt/runtime/server/translations.get.spec.ts)
is the shortest example:

```ts
const nitro = vi.hoisted(() => ({ vendor: undefined, cache: undefined }));

vi.mock("nitropack/runtime", () => ({
    defineCachedEventHandler: (handler, options) => {
        nitro.cache = options;
        return handler;
    },
    useRuntimeConfig: () => ({ translations: { vendor: nitro.vendor } }),
}));
```

The rest follows the repo's spec conventions — see the `writing-tests` skill.

## One thing not to copy across

URLs are **relative** in `@monorepo/i18n`, because the consumer builds the client with
`ofetch.create({ baseURL })`. They are **absolute** in `@monorepo/content`, whose providers compose
their own. Both READMEs argue their side. Whichever package you are in, follow its convention and
leave the other alone.

## Verify

```sh
pnpm exec nx run-many -t lint typecheck test --projects @monorepo/content
pnpm exec nx serve @monorepo/huella-legal  # the route only exists once a real app registers the module
```

A route that 404s in the app but passes its spec is almost always step 3 — the handler was written
and never registered.
