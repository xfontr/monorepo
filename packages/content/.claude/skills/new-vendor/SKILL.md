---
name: new-vendor
description: Add a CMS vendor to @monorepo/content — a ContentProvider subclass, its config type, configProblems(), one registry line and a spec. Use when adding or changing a content vendor such as Contentful, Sanity, Strapi or another WordPress-like API.
---

# Adding a content vendor

The steps are in the [Vendors section](../../../README.md#-vendors) of the package README. Follow
them; this file is what the prose can't enforce. Read
[`WordpressProvider.ts`](../../../src/core/adapters/providers/WordpressProvider.ts) first — it is
the only vendor, so it *is* the pattern.

## The five things that go wrong

1. **One `<Name>`, three places.** `contentful` → `ContentfulProvider.ts` →
   `class ContentfulProvider` → `contentful:` in the registry. The registry key is what appears in
   `nuxt.config.ts`, so a mismatch is a config that can't be typed.

2. **The provider is a default export.** `createProvider` reads `module.default`, and the config
   type is read off the instance (`ProviderOf<N>["config"]`). So:

   ```ts
   export type ContentfulProviderConfig = { space: string, accessToken: string };

   class ContentfulProvider extends ContentProvider<ContentfulProviderConfig> { … }

   export default ContentfulProvider;
   ```

   Export the config type as a named export too, and declare *only* what that vendor needs.
   There is no hoisted `baseURL` — if the endpoint is derived from a space or a dataset, derive it
   in the provider. The transport is built with no base URL for the same reason.

3. **`configProblems()` runs from the base constructor.** An override may only read `this.config` —
   the subclass's own field initialisers have not run yet, so a `private readonly apiPath = …`
   referenced from it is `undefined`. `core/ports/ContentProvider.spec.ts` pins this; meet it there
   rather than in production. Return *every* problem as a string, never throw: one
   `MisconfiguredVendorError` listing all of them beats one restart per missing env var.

4. **Only override `getEntry`/`getTerm` for a native single-document endpoint.** The inherited
   implementation is a one-item list and already handles the 404. Overriding it "for symmetry" adds
   two methods that can drift from the list path.

5. **The registry import stays lazy.** One line, `() => import(…)`. A static import ships every
   vendor to every deployment.

## The domain is not negotiable

A vendor's shapes never leave its adapter. Map to `Entry`, `Term` and `Page` in the provider; ids
are strings even when the vendor numbers them. If the vendor cannot serve a query axis, throw
`UnsupportedQueryError` — never silently drop it, because the result gets cached under the value
that was asked for. A transport failure surfaces as `UpstreamError` and nothing else; anything
other than a 400 or 404 becomes a 502, since an upstream 401 means *our* credentials are wrong.

If the vendor needs a resource family the domain doesn't have, that is a change to
`core/domain/content.ts` and a conversation about `Resource` being two closed unions — see the
README's deferred table before opening it up.

## No service layer

Callers talk to the port directly. A class forwarding one call to one collaborator is a name and a
file with no behaviour.

## Finish

A `<Name>Provider.spec.ts` beside it, covering the URL contract, the mapping, and a
misconfigured construction. Then:

```sh
pnpm exec nx run-many -t lint typecheck test --projects @monorepo/content
```

Nothing else. Config typing, lazy loading and the Nuxt routes follow from the registry line.
