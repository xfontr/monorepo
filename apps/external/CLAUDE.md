# 🤖 @monorepo/external

See [README.md](./README.md) for the env vars, the i18n wiring and the telemetry setup.

- **No env var gets a default in [`nuxt.config.ts`](./nuxt.config.ts), and nothing there reads
  `process.env`.** An unset vendor is supposed to fail loudly on the first request naming what is
  missing, not fall back to something plausible — and a value read from `process.env` is resolved at
  build time, which bakes the build host's environment into `.output/` and stops one artifact being
  promotable. Declare the key empty and let the `NUXT_`-prefixed var fill it at startup. The vendor
  `name` fields are the exception: they select a config type, so they stay literals. New config goes
  in `.env.example` with a row in the README table, and nowhere else.
- Feature code goes in a **Nuxt layer** under [`layers/`](./layers), one directory per domain, each
  with its own README. Layers auto-register by being there — never add an `extends` array.
- `app/` is the shell and stays thin: a layout, an entry page, an error page, client plugins. If
  something has domain logic, it belongs in a layer.
- Typechecking runs on build (`typescript.typeCheck: "build"`), so `pnpm build` is slow and already
  covers what `pnpm typecheck` would.
- The ESLint config is the nuxt flavour, which is **not** type-checked. Don't switch it.
- Shared packages are composed here, never reached into: import from `@monorepo/x`, not from a path
  inside it.
- Both telemetry halves are off when their URL is unset, which is why local dev ships nothing. Keep
  that property when adding instrumentation.
- The server observability plugin wraps `nitroApp.h3App.handler` by hand for reasons the README
  explains — OTel's HTTP instrumentation cannot patch `node:http` in this ESM build. Don't replace it
  with the standard instrumentation.
- **The span is named for the matched route, never the raw path.** It opens under the concrete URL
  because nothing has matched yet, and `end()` renames it. Keep the query string out of both the name
  and `http.route` — a 404 never matches a route, so the fallback is what a crawler hits, and leaving
  the query on it mints an unbounded number of operation names.
  [`observability.spec.ts`](./server/plugins/observability.spec.ts) pins it.
- `pnpm test` runs on the **node** preset. Nitro's auto-imports don't exist under Vitest, so a spec
  for anything in `server/` stubs them as globals — `defineNitroPlugin` before the import.
