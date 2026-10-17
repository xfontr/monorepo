---
issue: 271
status: implemented
decision: accepted
---

# 🧭 Console output fails the pipeline, in source and in every test run

## Context

A test run is meant to be silent: missing i18n keys, Vue warnings and runtime errors show up as
console output long before they show up as a failed assertion. Local runs are clean, but CI is a
different environment. The worry is noise that only CI produces, that nobody sees, and that a
change can add without anyone noticing.

Nothing stops it today. There is no `no-console` rule in
[`packages/configs/src/eslint/`](../../packages/configs/src/eslint/), no Vitest preset sets
`setupFiles` or `onConsoleLog`, and no Playwright spec listens for `console` or `pageerror`.
vue-i18n's missing-key warnings are on, because
[`i18n.config.ts`](../../apps/huella-legal/i18n/i18n.config.ts) sets only `datetimeFormats`.

## Result

**Any console output fails the run that produced it. Expected output is declared by stubbing it.**
Reading the logs instead can't work, because CI never prints them: Nx shows a task's output only
when the task fails, and the `checks` log of run 38773262855 ends with "28 out of 30 successful
tasks were not shown". Once the baseline is zero, a change that adds a message fails its own PR,
so "did this add new logs" needs no diff or baseline file.

**Local runs hid the noise too.** Vitest's default reporter printed no console line over all 8
projects (1,262 tests), while `--reporter=verbose` shows it, and the guard failed 67 tests in the two
Nuxt apps. Every one traced to the spec, not the app:

| Noise | Tests | Cause | Fix |
| --- | --- | --- | --- |
| `[VUE_ROUTER_R0004] No match found` | 30 | Fixtures linked to `/autores/…` and `/listado/…`, which the app doesn't route | `Byline.spec.ts`, `AuthorCard.spec.ts` and `Pagination.spec.ts` use `/colaboradores/…` and `/publicaciones?pagina=…` |
| `<Suspense> is an experimental feature` | 25 | Vue logs it once per app; `huella-legal` filters it in `devWarnings.client.ts`, `developer-portal` doesn't | The guard's one exemption, `UPSTREAM` in `consoleGuard.ts` |
| `[Vue warn]: Failed to resolve component: RouterLink` | 10 | `app/error.spec.ts` mounted with `mount`, which has no router | `mountSuspended` |
| `[intlify] Not found '…' key` | 9 | Script-side `t()` reached vue-i18n's empty test messages | `apps/huella-legal/vitest.setup.ts` sets `missingWarn = false` before every test, since the test bundle is empty by design |
| The collector's `✓`/`✗` lines | 4 | `tools/collect/index.spec.ts` runs a CLI | The spec stubs `console.log` and `console.error` |
| `async setup() … no <Suspense> boundary` | 1 | `app/pages/projects.spec.ts` used `mount` on an async page, so the page never rendered and the empty-list assertion passed vacuously | `mountSuspended` |

**E2E found three things the unit tests can't.** The built article page logged `Hydration
completed but contains mismatches` (19 tests): `ShareBar.vue` and `CiteBox.vue` render a button
behind VueUse's `isSupported`, which is `false` on the server and already `true` in the client's
hydration pass. Both buttons now sit in `<ClientOnly>`. Every not-found spec logs Chrome's `Failed
to load resource: … 404`, which a real 404 page always does, so those specs allow it through
`NOT_FOUND_DOCUMENT`, which the Playwright preset exports. And every 404 made the server log `[request error] [fatal]`,
because [`createPageError.ts`](../../apps/huella-legal/app/utils/createPageError.ts) set `fatal: true`
and Nitro logs every fatal error. It's now fatal only on the client or for a 5xx. On the server Nuxt
renders the error page either way, and a non-fatal 404's payload carries only the BFF route.

The industry practice matches. MUI and React fail any test with an unexpected `console.error` or
`warn`. GitLab's Jest `console_watcher` does too, with a top-level ignores list migrated test by
test. Shopware adopted `jest-fail-on-console` (ADR 2021-06-14) after runs produced "hundreds of
errors and warnings".

Line numbers are as of this report.

| # | Where | The change |
| --- | --- | --- |
| 1 | New `packages/configs/src/eslint/lib/console.ts`, exported from `lib/index.ts`, spread into `createNodeConfig` in `eslint/node.ts` and into `eslint/vue.ts` | `no-console: "error"`, off for `**/*.spec.ts`. Use `no-console`, not a selector: [`restrictedSyntax.ts`](../../packages/configs/src/eslint/lib/restrictedSyntax.ts) warns that a second `no-restricted-syntax` config replaces its selectors. Add a row to `lib/README.md` |
| 2 | Every deliberate call | No file-level exemption anywhere: a file allowed to log would let a new, accidental log through too. Each deliberate reference gets `// eslint-disable-next-line no-console -- <reason>` on the line above, which the reviewer of the change sees, the same form the repo already uses for other rules. The sites: the collector's two output helpers in `apps/developer-portal/tools/collect/index.ts`, the dev banner in `infrastructure/translations/server/src/index.ts`, `server/plugins/errorLog.ts` and `app/plugins/devWarnings.client.ts` in `apps/huella-legal`, and `consoleGuard.ts` and `playwright/server.ts` in `packages/configs`. The rule flags every `console.x` reference, assignments included |
| 3 | `packages/i18n/src/nuxt/module.ts:54,64` | Both build-time `console.warn`s go through `useLogger("@monorepo/i18n")` from `@nuxt/kit`, already a dependency. The three `console.warn` spies in `module.spec.ts:110,123,134` move to the logger |
| 4 | New `packages/configs/src/vitest/setup/consoleGuard.ts`, in `setupFiles` of `createNodeConfig` in `vitest/node.ts` | A hand-rolled guard, inherited by `vue.ts` and `nuxt.ts`. On load it replaces `console.log/info/warn/error/debug` with a recorder, once. `beforeAll`, `afterEach` and `afterAll` each throw with every message recorded since the last check, with its stack, so output from collection and from a spec's own hooks fails too. `afterEach` first runs `vi.restoreAllMocks()` |
| 5 | `packages/configs/src/vitest/nuxt.ts`, `createNuxtConfig` | Pass the guard to both projects. The `nuxt` project's `setupFiles` is the guard plus the caller's, never the caller's alone |
| 6 | New `packages/configs/src/playwright/test.ts`, exported as `@monorepo/configs/playwright/test`, with `@playwright/test` moved to the pnpm catalog | Extends `@playwright/test`'s `test` by overriding `page`. The catalog keeps one resolved copy, which Playwright requires. It collects every `console` message and every `pageerror`, and after `use(page)` expects the list to be empty, minus an `allowedConsole: RegExp[]` option set with `test.use` |
| 7 | `apps/huella-legal/e2e/*.spec.ts` | Import `expect`, `test` and `NOT_FOUND_DOCUMENT` from `@monorepo/configs/playwright/test` |
| 8 | New `packages/configs/src/eslint/lib/e2eFixture.ts`, in both presets | `no-restricted-imports` of `test` from `@playwright/test` in `**/e2e/**/*.spec.ts`, so a new spec can't bypass row 6 |
| 9 | New `packages/configs/src/playwright/server.ts` (exported as `@monorepo/configs/playwright/server`) and `teardown.ts`, `createConfig` in `playwright/index.ts`, `apps/huella-legal/e2e/server.ts` | The app's preload calls `recordServerConsole()`, which replaces the server's `console` with a recorder. It prints only until Nitro listens, so a boot crash still reaches Playwright's output, and a request's log is printed once, by the teardown, not again as `[WebServer]` output. It appends each message to the path `createConfig` passes in `E2E_SERVER_CONSOLE`, the app's `node_modules/.cache/e2e/`, outside `.playwright/`. Nitro's own `Listening on <url>` line is the one exemption. `teardown.ts`, which `createConfig` sets as `globalTeardown`, fails the run if the file has anything else, or if it doesn't exist because the preload never called the recorder |
| 9a | `ShareBar.vue`, `CiteBox.vue`, `createPageError.ts` in `apps/huella-legal` | The e2e findings above, fixed at their source |
| 10 | `packages/configs/README.md`, `apps/huella-legal/README.md`, the `writing-tests` skill | The rule, the guard, the stub-to-expect convention and the e2e fixture. Then `pnpm docs:map` |

**The guard is hand-rolled.** `vitest-fail-on-console`, `jest-fail-on-console` (Jest only) and
`console-fail-test` are each small and maintained by one person, while the projects that do this at
scale write their own. It's about forty lines in the package that already owns test setup.

**A test that expects output stubs it.** `vi.spyOn(console, "warn").mockImplementation(() => {})`
swallows the call before it reaches the recorder, and the assertion goes on the spy, the way
`packages/i18n/src/nuxt/module.spec.ts:110` already works.

**E2E and unit tests catch different noise.** E2E runs against the production build, where Vue and
vue-i18n compile their dev warnings out. So the fixture catches runtime errors, failed resource
loads and hydration failures, and Vue warnings are row 4's job. Missing keys are no layer's job
while unit tests run on an empty bundle with `missingWarn` off. SSR runs in the server process, so
its output never reaches `page.on("console")`. Row 9 covers it.

## Options considered

| Option | Why not |
| --- | --- |
| Exempt files or folders in each project's `eslint.config.ts` | Allows every future log in that file, deliberate or not, and nothing at the line tells the next developer the file is special |
| `vitest-fail-on-console` | One maintainer and a small user base, to save about forty lines. The guard also has to fit two repo-specific rules a library wouldn't know: install once, before the Nuxt boot, and treat a stub as the declaration of expected output |
| Parse CI logs for warnings | Nx doesn't print a successful task's output, so there is nothing to parse without `--output-style=static` on every run. A log parser is also a second, fuzzier copy of what the test runner already knows per test |
| Warn instead of fail, or fail only on `warn` and `error` | A check that never fails gets ignored, which is how the noise built up in the projects above. `log` and `info` left in a test are stray debugging, and they're the same signal |
| A committed baseline that only blocks new messages (Betterer-style ratchet) | All 67 unit-test failures were fixed at their source in one change, which leaves a baseline file nothing to hold |
| Vitest's `onConsoleLog` hook | It runs in the main process and can only drop a message, not fail the test that logged it |
| Each app's own `e2e/test.ts`, extending the `test` it passes into the preset | Keeps the preset free of a runtime Playwright import, at the price of a file every app copies. Both pin the same version, so the only risk was drift, which the catalog entry removes |

## Consequences

Specs get stricter to write, as Shopware recorded: every component, request and translation key a
test touches has to really exist, because the warning it would have printed now fails the test.
Real third-party noise goes on an allowlist, and every entry carries a reason.

**Order.** Rows 1–3 first: the lint rule lands without breaking anything because the deliberate
call sites move in the same change. Then rows 4–5, with the spec fixes in the noise table, since the
guard fails those 67 tests until they land. Then rows 6–9 for e2e, and 9a before the `e2e` job can
go green. Row 10 last, describing what landed.

**Tripwires an implementer will hit.**

- **Never reinstall the recorder.** In the `nuxt` project, setup files run before the Nuxt boot, and
  [`devWarnings.client.ts`](../../apps/huella-legal/app/plugins/devWarnings.client.ts) then wraps
  `console.info` to filter Vue's `<Suspense>` message. Reassigning `console.info` in `beforeEach`
  throws that filter away, and every page spec fails on the message.
- Two phases, two answers: the `@nuxt/test-utils` environment is set up before any setup file, so
  the guard can't see output from that setup, while the app's plugins run after it.
- `vi.restoreAllMocks()` in the guard restores every `vi.spyOn` spy after each test. No spec keeps a
  spy across tests today; one that needs to has to recreate it in its own `beforeEach`.
- Playwright empties `outputDir` (`.playwright/`) when the run starts, after the server it started
  may already have written. That's why row 9's log lives elsewhere.
- The fixture checks once the test body returns. Nuxt boots after `load`, so a test that ends on
  `page.goto` can pass while the app logs; another test on the same page still catches it.
- A throw in `globalTeardown` exits 1 even when every test passed, and the list reporter prints it
  as "1 error was not a part of any test".
- Don't trust a quiet local run as a baseline: Vitest's default reporter here prints no console
  line, and `--reporter=verbose` shows what it hid.
- The first CI run with the guard is the real measurement. If it fails on noise that local runs
  never show, fix it at its source. If there's too much to fix in one change, use a temporary
  ignores list (GitLab's approach) with a filed issue per entry.
- `mockNuxtImport("useI18n", () => () => ({ t }))` breaks any child that reads more of the
  composer, which is why the article specs spread `original()` and override only `t`.
- Move the i18n warnings to `useLogger` (row 3) rather than stubbing them. The guard may stop
  seeing them afterwards, which is fine for build-time output.
- The developer portal's collector prints through `print` and `printError`, the two opted-out
  helpers at the top of `tools/collect/index.ts`. A new tool that prints adds its own opt-out.
  [`infrastructure/scripts`](../../infrastructure/scripts/README.md) prints through `out.*` and
  `process.stdout.write`, which the guard doesn't see either. Its specs already spy on the streams.

Revisit this if a dependency starts printing a message the repo can't fix and can't upgrade away
from in the unit tests. That's the point where an `ignores` option on the presets earns its place.

## Confirmation

| Claim | Check |
| --- | --- |
| Source can't log | A `console.log("x")` added to `packages/content/src/` fails `pnpm exec nx lint @monorepo/content` |
| The node preset fails on output | A `console.warn("x")` added to any `packages/content` spec fails `pnpm exec nx test @monorepo/content`, naming the test and the message |
| The vue preset fails on output | The same in `packages/ui`'s spec fails `pnpm exec nx test @monorepo/ui`, so happy-dom's `console` is the patched one |
| The nuxt preset fails on output | A `console.warn("x")` in a `huella-legal` `app/` spec fails `pnpm exec nx test @monorepo/huella-legal`. Missing keys don't: `vitest.setup.ts` turns `missingWarn` off |
| Boot-time wrappers survive | `pnpm exec nx test @monorepo/huella-legal` passes, page specs included, with `devWarnings.client.ts`'s filter unchanged |
| Expected output is declared, not leaked | `pnpm exec nx test @monorepo/i18n` passes with `module.spec.ts` asserting on the logger |
| The browser fails e2e | A `console.error("x")` in a `huella-legal` client plugin fails `pnpm exec nx test:e2e @monorepo/huella-legal` in the fixture |
| The server fails e2e | A `console.warn("x")` in a `huella-legal` server route fails the same run in `globalTeardown` |
| No spec bypasses the fixture | `import { test } from "@playwright/test"` in an `e2e/*.spec.ts` fails `pnpm exec nx lint @monorepo/huella-legal` |
| Nothing regressed | `pnpm exec nx run-many -t lint typecheck test` and the `e2e` CI job pass |
