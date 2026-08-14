# 📦 @monorepo/observability

Shared telemetry. Two entry points, one per runtime: [Grafana Faro](https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/)
in the browser, the [OpenTelemetry](https://opentelemetry.io/docs/languages/js/) Node SDK on the
server — so no app has to remember the boilerplate for either.

```ts
import { startWebTelemetry } from "@monorepo/observability";

const faro = startWebTelemetry({
    url: "https://faro-collector-<region>.grafana.net/collect/<app-key>",
    app: { name: "@monorepo/external", version: "1.0.0", environment: "production" },
});

faro.api.pushError(new Error("boom"));
```

```ts
import { startNodeTelemetry } from "@monorepo/observability/node";

const provider = startNodeTelemetry({
    url: "https://otlp-gateway-<zone>.grafana.net/otlp",
    instanceId: "123456",
    token: "glc_…",
    app: { name: "@monorepo/external", version: "1.0.0", environment: "production" },
});
```

That is the whole package — [`src/index.ts`](./src/index.ts) and [`src/node.ts`](./src/node.ts).
Both are wrappers over their vendor, not an abstraction over telemetry vendors: no ports, no
adapters, no registry. The config is whatever Faro and the OpenTelemetry SDK take.

The two entries must stay apart. Faro touches `window`; the Node one pulls in `diagnostics_channel`,
`node:async_hooks` and a protobuf exporter. Importing one from the other would drag either set into
the wrong bundle.

For a worked example, [`@monorepo/external`](../../apps/external) calls both — the browser one from
`app/plugins/observability.client.ts`, the Node one from `server/plugins/observability.ts` — and
skips the call entirely when no collector URL is set, so local dev sends nothing without needing a
flag.

## 📥 What you get for free

**Browser.** `getWebInstrumentations()` covers errors, unhandled rejections, web vitals, console and
session tracking. `TracingInstrumentation` adds fetch/XHR spans and registers a global OpenTelemetry
tracer provider, so a caller that wants manual spans can install `@opentelemetry/api` and use
`trace.getTracer()` without this package being involved.

**Server.** Outbound `fetch` spans (via undici) and `traceparent` propagation in both directions —
an incoming header continues the browser's trace, an outgoing request carries ours. Every span is
stamped with `service.name`, `service.version` and `deployment.environment.name` from `app`.
`provider.register()` installs the W3C propagator and the async context manager, so a caller can
`trace.getTracer()` and open its own spans without this package being involved.

The inbound span is *not* included — see the gotcha below.

## ⚠️ Gotchas

- **Browser only for the default entry.** Faro touches `window` while initializing, so it must not
  run during SSR — in Nuxt that means a `.client` plugin.
- **No inbound span. The caller opens it.** `HttpInstrumentation` is deliberately not installed,
  because it cannot work here: patching `node:http` under ESM needs
  `--import @opentelemetry/instrumentation/hook.mjs` preloaded, and under Nitro the module is
  imported before any server plugin runs anyway. Shipping it would only add a dependency and a
  startup warning. So outbound fetches would report as their own root traces unless the caller
  opens a request span to hang them on — see [`@monorepo/external`](../../apps/external/server/plugins/observability.ts),
  which wraps `nitroApp.h3App.handler`. `UndiciInstrumentation` is unaffected by all of this: it
  listens on `diagnostics_channel` rather than patching a module.
- **`app.version` is the caller's to supply.** Telemetry stamped `0.0.0` cannot be attributed to a
  release.
- **Stack traces arrive minified.** De-obfuscating them needs source maps uploaded from the caller's
  own build — a bundler concern, not a runtime one, so it would live in the app rather than here. No
  app does it yet.

## 🛰️ Where the data goes

Two endpoints, one backend. The browser posts Faro's own payload to the Faro collector; the server
posts OTLP to the Grafana Cloud OTLP gateway, authenticating with `instanceId:token` as basic
credentials. Both land in Tempo, which is why a browser span and the server span it caused end up
on the same trace.

The exception is the first page load: an SSR document request is a navigation, not a `fetch`, so it
carries no `traceparent` and its server trace stands alone. Everything the page fetches afterwards
joins up.

## 🧭 Not here yet

**Cross-origin trace propagation.** Every request the browser makes today is same-origin — its own
Nitro server — which Faro's tracing instrumentation already propagates `traceparent` on. The day the
browser calls another origin directly, that origin has to be passed as Faro's
`propagateTraceHeaderCorsUrls` or the header is dropped and the trace splits into two unrelated
halves. Add the option when there is a caller for it, not before.

**Metrics.** `service.name` is on every span already, so RED metrics can be derived in Grafana
without shipping a second signal. The `./node` entry builds a `NodeTracerProvider` — traces and
nothing else — so metrics mean adding a `MeterProvider` alongside it (plus
`@opentelemetry/instrumentation-runtime-node` for event-loop and GC) the day someone wants heap and
lag graphs.

**Node telemetry for [`infrastructure/translations`](../../infrastructure/translations).** The
`./node` entry fits it as-is, with the same caveat as any ESM service: it gets outbound fetch spans
and propagation, but the inbound span is the caller's to open.
