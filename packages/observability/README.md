# 📦 @monorepo/observability

Shared telemetry. One function that starts [Grafana Faro](https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/)
in the browser with the instrumentations we want, so no app has to remember the boilerplate.

```ts
import { startWebTelemetry } from "@monorepo/observability";

const faro = startWebTelemetry({
    url: "https://faro-collector-<region>.grafana.net/collect/<app-key>",
    app: { name: "@monorepo/external", version: "1.0.0", environment: "production" },
});

faro.api.pushError(new Error("boom"));
```

That is the whole package — [`src/index.ts`](./src/index.ts). It is a wrapper over
`initializeFaro`, not an abstraction over telemetry vendors: no ports, no adapters, no registry.
Faro is the vendor we use, and the config is whatever Faro takes.

## 📥 What you get for free

`getWebInstrumentations()` covers errors, unhandled rejections, web vitals, console and session
tracking. `TracingInstrumentation` adds fetch/XHR spans and registers a global OpenTelemetry tracer
provider, so a caller that wants manual spans can install `@opentelemetry/api` and use
`trace.getTracer()` without this package being involved.

## ⚠️ Gotchas

- **Browser only.** Faro touches `window` while initializing, so it must not run during SSR — in
  Nuxt that means a `.client` plugin.
- **`app.version` is the caller's to supply.** Telemetry stamped `0.0.0` cannot be attributed to a
  release.
- **Stack traces arrive minified.** De-obfuscating them needs source maps uploaded from the caller's
  own build — a bundler concern, not a runtime one, so it would live in the app rather than here. No
  app does it yet.

## 🧭 Not here yet

**Cross-origin trace propagation.** Every request the browser makes today is same-origin — its own
Nitro server — which Faro's tracing instrumentation already propagates `traceparent` on. The day the
browser calls another origin directly, that origin has to be passed as Faro's
`propagateTraceHeaderCorsUrls` or the header is dropped and the trace splits into two unrelated
halves. Add the option when there is a caller for it, not before.

**Node telemetry** for [`infrastructure/translations`](../../infrastructure/translations) — that is
the OpenTelemetry Node SDK plus `@hono/otel`, a different set of packages that must not be pulled
into a browser bundle. When it lands it belongs in a separate entry point (`./node`), not in this
one.
