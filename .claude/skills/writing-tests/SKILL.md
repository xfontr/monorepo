---
name: writing-tests
description: The spec conventions for this repo — globals are off, specs sit beside their subject, titles name the failure being pinned, and mocks follow one vi.hoisted recipe. Use when adding or changing any *.spec.ts anywhere in the workspace.
---

# Writing specs here

32 specs, one recipe. None of it is configured per project — every `vitest.config.ts` in the
workspace is a two-line wrapper over
[`@monorepo/configs`](../../../packages/configs/src/vitest/node.ts), so the conventions below are the
whole of what makes a spec fit in.

## The two things that break first

- **`globals: false`.** Import `describe`, `it`, `expect` and `vi` from `vitest` in every file. A
  spec written against the ambient globals fails to typecheck, not to run, so the error arrives from
  somewhere unhelpful.
- **The spec sits beside its subject**, same basename: `translationsKey.ts` →
  `translationsKey.spec.ts`. There is no `__tests__`, no `__mocks__`, and no fixtures directory
  anywhere in the workspace. Test data is a `const` at the top of the file it belongs to.

## Titles name the failure, not the function

A title says what would be true if the code were wrong. No "should", no restating the method name:

```ts
it("keys by vendor, project and locale so tenants never share a payload", () => {
it("hands the transport to the provider, so it can never be built unable to fetch", async () => {
it("rejects an unregistered vendor name instead of returning a broken provider", async () => {
```

A comment above a `describe` or a tricky `it` explains why the test exists — the same rule the root
[`CLAUDE.md`](../../../CLAUDE.md) applies to code comments. `it.each` covers validation matrices;
[`TolgeeProvider.spec.ts`](../../../packages/i18n/src/core/adapters/providers/TolgeeProvider.spec.ts)
is the example.

## The mock recipe

One shape, used in about nine files. A `vi.hoisted` box holds the mutable state, `vi.mock` reads from
it, and `beforeEach` resets:

```ts
const ofetch = vi.hoisted(() => ({ create: vi.fn(), request: vi.fn() }));

vi.mock("ofetch", () => ({ ofetch: { create: ofetch.create } }));

beforeEach(() => {
    vi.clearAllMocks();
});
```

| Subject | What gets mocked | Example |
| --- | --- | --- |
| A Nuxt module | `@nuxt/kit` | [`module.spec.ts`](../../../packages/content/src/nuxt/module.spec.ts) |
| A cached server route | `nitropack/runtime` + `ofetch` | [`translations.get.spec.ts`](../../../packages/i18n/src/nuxt/runtime/server/translations.get.spec.ts) |
| A composable | `vi.stubGlobal("$fetch", …)` | [`useContent.spec.ts`](../../../packages/content/src/nuxt/runtime/composables/useContent.spec.ts) |
| A provider | nothing — inject a fake `HttpClient` through the port | [`TolgeeProvider.spec.ts`](../../../packages/i18n/src/core/adapters/providers/TolgeeProvider.spec.ts) |
| A Nitro plugin | one `vi.stubGlobal` per Nitro auto-import | [`observability.spec.ts`](../../../apps/external/server/plugins/observability.spec.ts) |

A Nitro plugin is the one subject that needs globals rather than module mocks: Nitro auto-imports
`defineNitroPlugin`, `useRuntimeConfig`, `getRequestHeaders` and the rest at build time, so the file
imports none of them and they simply do not exist under vitest. `defineNitroPlugin` has to be stubbed
**before** the dynamic import — it runs at module evaluation, and the plugin body is its argument.

A provider never needs `vi.mock`. The `HttpClient` port exists so the transport can be passed in;
reaching for a module mock there means the injection was skipped.

## The two specs that pin invariants rather than behaviour

Both are easy to break by accident and neither is optional:

- **`src/index.spec.ts`** asserts `Object.keys(api).sort()` against a literal list, so widening the
  public API is a decision rather than a side effect of adding a file. Add an export, add the line.
- **`core/ports/*Provider.spec.ts`** pins that `configProblems()` / `optionProblems()` runs from the
  base constructor, before a subclass's field initialisers. Both `*:new-vendor` skills lean on it.

## Where the boilerplate lives

[`packages/ui/lib/components/Button.spec.ts`](../../../packages/ui/lib/components/Button.spec.ts) is
the one spec in the workspace not written to any of this — `describe("test")`, `it("render")`,
asserting on the string `"test"`. It is scaffolding that was never revisited. Copy the shape of a
Vue spec from it if you must, but not its titles, and fix it if you touch it.

## Verify

```sh
pnpm exec nx test @monorepo/<name>
pnpm exec nx run-many -t test              # the whole workspace
```

Every project has a `test` target, `apps/external` included — its `vitest.config.ts` is the same
two-line wrapper, on the node preset, because the only thing specced there is the Nitro plugin. A
spec for anything under `app/` would need the vue preset and a `vite.config.ts` to merge, which the
app does not have yet.
