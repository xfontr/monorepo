# 🤖 @monorepo/huella-legal

See [README.md](./README.md) for the env vars, the i18n wiring and the telemetry setup.

- **No URL or credential gets a default in [`nuxt.config.ts`](./nuxt.config.ts), and nothing there
  reads `process.env`.** An unset vendor must fail loudly, not fall back to something plausible: list
  a var the feature can't work without under `requiredEnv` in the `nuxt.config.ts` of the layer that
  uses it, and [`modules/requiredEnv.ts`](./modules/requiredEnv.ts) fails a production deploy naming
  it. Never re-check it per request. Declare the key empty and let the `NUXT_`-prefixed var fill it
  at startup; the
  [i18n module](../../packages/i18n/src/nuxt/README.md#-usage) says why. The vendor `name` fields are
  the exception: they select a config type, so they stay literals. So are the observability `version`
  and `environment`, which default to `0.0.0` and `development`. New config goes in `.env.example`
  with a row in the README table, and nowhere else.
- **No UI copy is hard-coded outside `/lab`.** It goes in
  [`infrastructure/translations/projects/huella-legal/es-ES.json`](../../infrastructure/translations/projects/huella-legal/es-ES.json)
  under a key that follows the [naming convention](./README.md#-copy-keys), and the component calls
  `t()`. Dev reads that file and builds read Tolgee, which is deliberately left behind for now.
  Don't update Tolgee; the owner brings it up to date.
- **Domain logic lives in a Nuxt layer under `layers/`**, one directory per domain, beside `app/`
  rather than inside it: Nuxt auto-registers only `<rootDir>/layers/*`, so never add an `extends`
  array. A concern several domains share, such as `forms` (the honeypot and Turnstile), gets a layer
  too, and other layers reach its server code through Nitro's auto-import, never a relative path.
  `app/` stays thin, with no domain logic of its own. A layer's view-model types go in
  `shared/types/`, one per file, and its `server/` maps vendor shapes into them, so an `Entry` never
  reaches the browser. Those mappers go in `server/mappers/`, one file per view model and named for
  it; `server/utils/` is only for helpers that know nothing about the domain, so a cached read that
  several routes share goes in `server/services/`. A vendor client that one layer calls goes in
  `server/adapters/`, named for the vendor, so it stays out of Nitro's auto-imports.
  **Only the shell may use anything:** the kit (`app/components/base`, `app/components/listing`,
  `app/types`, `app/utils`, `app/composables`) uses only itself, a layer uses itself, the kit and
  `forms`, and only a feature's `app/pages/` may render another feature's auto-registered
  components. Nothing checks this but review, since auto-imports hide every edge from the linter.
- Typechecking runs on build (`typescript.typeCheck: "build"`), so `pnpm build` is slow and already
  covers what `pnpm typecheck` would.
- [`tsconfig.json`](./tsconfig.json) only references `./.nuxt/tsconfig.*.json`, which `nuxi
  prepare`/`build` generate and nothing commits — a fresh checkout with no lifecycle scripts (both
  banned here) has no `.nuxt/` at all, so `lint`/`typecheck`/`test` all fail without it. The
  `nuxt-prepare` script and the root [`nx.json`](../../nx.json)'s `dependsOn` on it are what
  regenerate `.nuxt` first — see [the root AGENTS.md](../../AGENTS.md#-the-two-places-that-must-agree).
- The ESLint config is the nuxt flavour, which is **not** type-checked. Don't switch it.
- Shared packages are composed here, never reached into: import from `@monorepo/x`, not from a path
  inside it.
- Both telemetry halves are off when their URL is unset, which is why local dev ships nothing. Keep
  that property when adding instrumentation.
- The server observability plugin wraps `nitroApp.h3App.handler` by hand, for reasons
  [`@monorepo/observability`](../../packages/observability/README.md#️-gotchas) explains. Don't
  replace it with the standard instrumentation.
- **The span is named for the matched route, never the raw path.** It opens under the concrete URL
  because nothing has matched yet, and `end()` renames it. Keep the query string out of both the name
  and `http.route` — a 404 never matches a route, so the fallback is what a crawler hits, and leaving
  the query on it mints an unbounded number of operation names.
  [`observability.spec.ts`](./server/plugins/observability.spec.ts) pins it.
- `pnpm test` runs two Vitest projects: **node** for `server/`, `shared/` and `tools/`, and **nuxt**
  for `app/`, each in the app root and in every layer. Nitro's auto-imports don't exist under the
  node project, so a spec for anything in `server/` stubs them as globals, `defineNitroPlugin`
  before the import. Content domain values in any spec come from `@monorepo/content/testing`'s
  `fake*` factories.
- **`vitest.config.ts` and `playwright.config.ts` are wrappers over `@monorepo/configs`.** A setting
  every Nuxt app would want goes in the preset; only this app's specifics are passed as options.
  Don't lower a threshold to get green; write the spec.
- `e2e/` holds the Playwright specs, `server.ts` (the MSW preload), `fakes.ts` (its data) and
  `vendors.ts` (handlers for the vendors with no package), the workspace's exception to "beside its
  subject" and "no fixtures". A packaged vendor's wire format belongs in that package's `testing`
  entry, never here. Test-only code never goes under `layers/`, `app/` or `server/`.
- **No `toHaveScreenshot`.** Baselines failed every page PR while the design still moves; the
  [README](./README.md#-e2e) says when they come back. Assert on roles, text and status instead.
