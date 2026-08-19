# 🤖 @monorepo/observability

See [README.md](./README.md) — it documents both entry points, what each instruments for free, and
where the data lands.

The invariants worth losing a build over:

- **This is not a ports-and-adapters package, and that is deliberate.** Both entries are wrappers
  over their vendor, not an abstraction over telemetry vendors: no ports, no adapters, no registry,
  no `configProblems()`. `@monorepo/i18n` and `@monorepo/content` argue the other way because they
  expect a second vendor; this one does not. Don't harmonise them.
- **The two entries must never import each other.** [`src/index.ts`](./src/index.ts) touches
  `window`; [`src/node.ts`](./src/node.ts) pulls in `diagnostics_channel`, `node:async_hooks` and a
  protobuf exporter. One importing the other drags either set into the wrong bundle.
- **`HttpInstrumentation` is absent on purpose.** It cannot patch `node:http` in this ESM build, and
  under Nitro the module is imported before any server plugin runs. Adding it back buys a dependency
  and a startup warning. The inbound span is the caller's to open — see the hand-rolled wrapper in
  [`apps/external/server/plugins/observability.ts`](../../apps/external/server/plugins/observability.ts).
- Config is whatever Faro and the OpenTelemetry SDK take. There is no validation layer here, so an
  unset collector URL is the caller's job to check — which is how both halves no-op in local dev.
  Keep that property when adding instrumentation.
- `app.version` is supplied by the caller. Nothing here invents one; telemetry stamped `0.0.0`
  cannot be attributed to a release.

Tagged `type:observability`, so it may depend only on `@monorepo/configs`. Nothing in the workspace
may depend on it except an app.
