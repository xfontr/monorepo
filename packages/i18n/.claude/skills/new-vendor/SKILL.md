---
name: new-vendor
description: Add a TMS vendor to @monorepo/i18n — a TranslationProvider subclass, its options type, optionProblems() and one registry line. Use when adding or changing a translations vendor such as Phrase, Crowdin, Lokalise or another Tolgee-like API.
---

# Adding a translations vendor

The steps are in the [Vendors section](../../../README.md#-vendors) of the package README. Follow
them; this file is what the prose can't enforce.
[`TolgeeProvider.ts`](../../../src/core/adapters/providers/TolgeeProvider.ts) is the example with
options, [`InternalProvider.ts`](../../../src/core/adapters/providers/InternalProvider.ts) the one
without.

## The four things that go wrong

1. **One `<Name>`, three places.** `phrase` → `PhraseProvider.ts` → `class PhraseProvider` →
   `phrase:` in the registry. The registry key is what appears in `nuxt.config.ts`.

2. **The provider is a default export**, and the `options` type is read off the instance
   (`ProviderOf<N>["options"]`). That derivation is what makes `options` **required** in config for
   a vendor that has them and **forbidden** for one that doesn't:

   ```ts
   export interface PhraseProviderOptions {
       token: string
   }

   class PhraseProvider extends TranslationProvider<PhraseProviderOptions> {
       protected override optionProblems(): string[] { … }

       override async getTranslations(locale: Locale): Promise<TranslationMap> { … }
   }

   export default PhraseProvider;
   ```

   Note the shape differs from `@monorepo/content`: here `baseURL` and `project` are on the base
   class for every vendor, and only `options` is per-vendor. Don't re-declare them. Overrides carry
   the `override` keyword.

3. **`optionProblems()`, not `configProblems()`** — and it is optional, defaulting to no problems.
   It is called from the base constructor via `assertConfigured()`, so an override may only read
   `this.options`; the subclass's own field initialisers have not run. Return every problem as a
   string, never throw: one `MisconfiguredVendorError` listing all of them beats one restart per
   missing env var. `project` non-empty and `baseURL` absolute are already checked in the base — do
   not repeat them.

4. **The registry import stays lazy.** One line, `() => import(…)`. A static import ships every
   vendor to every deployment.

## Boundaries

`getTranslations` returns a `TranslationMap` — the vendor's response shape never leaves the
adapter. All I/O goes through the injected `HttpClient`; a provider that imports `ofetch` directly
has bound itself to a transport.

The URLs here are **relative**: the consumer builds the client with `ofetch.create({ baseURL })`, so
a provider passes a path. (`@monorepo/content` is the opposite — absolute URLs, no base URL on the
client. Don't copy that convention across.)

No service layer over the port: a class forwarding one call to one collaborator adds a name and a
file without adding behaviour. Locale fallback or merging local overrides would be the day that
changes.

## Finish

A `<Name>Provider.spec.ts` beside it, covering the URL contract, the mapping, and a misconfigured
construction. Then:

```sh
pnpm exec nx run-many -t lint typecheck test --projects @monorepo/i18n
```

Nothing else. Config typing, lazy loading and the Nuxt route follow from the registry line.
