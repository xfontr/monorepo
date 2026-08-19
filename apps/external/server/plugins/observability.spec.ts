import { beforeEach, describe, expect, it, vi } from "vitest";
import type { H3Event } from "h3";
import { SpanKind, SpanStatusCode } from "@opentelemetry/api";
import {
    ATTR_CLIENT_ADDRESS,
    ATTR_HTTP_REQUEST_METHOD,
    ATTR_HTTP_RESPONSE_STATUS_CODE,
    ATTR_HTTP_ROUTE,
    ATTR_SERVER_ADDRESS,
    ATTR_URL_PATH,
    ATTR_URL_QUERY,
    ATTR_USER_AGENT_ORIGINAL,
} from "@opentelemetry/semantic-conventions";

const otel = vi.hoisted(() => {
    const span = {
        updateName: vi.fn(),
        setAttributes: vi.fn(),
        setStatus: vi.fn(),
        recordException: vi.fn(),
        end: vi.fn(),
    };

    const tracer = { startActiveSpan: vi.fn() };

    return { span, tracer, getTracer: vi.fn(), getActiveSpan: vi.fn(), extract: vi.fn(), active: vi.fn() };
});

const telemetry = vi.hoisted(() => ({
    provider: { shutdown: vi.fn() },
    startNodeTelemetry: vi.fn(),
}));

// Only the three entry points the plugin reaches through are replaced — SpanKind and SpanStatusCode
// stay real, so the spec pins the values a collector actually receives rather than its own sentinels
vi.mock("@opentelemetry/api", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@opentelemetry/api")>()),
    trace: { getTracer: otel.getTracer, getActiveSpan: otel.getActiveSpan },
    context: { active: otel.active },
    propagation: { extract: otel.extract },
}));

vi.mock("@monorepo/observability/node", () => ({ startNodeTelemetry: telemetry.startNodeTelemetry }));

const APP = { name: "@monorepo/external", version: "1.4.0", environment: "production" };

const COLLECTOR = "https://otlp-gateway-prod-eu-west-0.grafana.net/otlp";

const PARENT = "parent-context";
const ACTIVE = "active-context";
const TRACEPARENT = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01";
const USER_AGENT = "Mozilla/5.0";
const CLIENT_IP = "203.0.113.4";
const BODY = { ok: true };

// Nitro auto-imports these at build time, so the plugin never imports them and they do not exist
// under vitest. `defineNitroPlugin` has to be stubbed before the module is imported: it runs at
// module evaluation, and the plugin function is its argument.
let runtimeConfig: ReturnType<typeof createConfig>;
let responseStatus: number;

vi.stubGlobal("defineNitroPlugin", (plugin: unknown) => plugin);
vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("useRuntimeConfig", () => runtimeConfig);
vi.stubGlobal("getRequestHeaders", () => ({ traceparent: TRACEPARENT }));
vi.stubGlobal("getRequestHost", () => "external.test");
vi.stubGlobal("getRequestHeader", (_event: unknown, name: string) => (name === "user-agent" ? USER_AGENT : undefined));
vi.stubGlobal("getRequestIP", () => CLIENT_IP);
vi.stubGlobal("getResponseStatus", () => responseStatus);
vi.stubGlobal("createError", (error: { statusCode?: number }) => ({ statusCode: error.statusCode ?? 500 }));

const plugin = (await import("./observability")).default as unknown as (nitroApp: NitroApp) => void;

type Handler = (event: H3Event) => unknown;

type NitroApp = ReturnType<typeof createNitroApp>;

function createConfig(url: string = COLLECTOR) {
    return {
        observability: { url, instanceId: "123456", token: "glc_token" },
        public: { observability: { url: "", app: APP } },
    };
}

function createNitroApp(handle: Handler) {
    const hooks = new Map<string, (payload: never) => unknown>();

    return {
        h3App: { handler: handle },
        hooks: {
            hook: (name: string, fn: (payload: never) => unknown) => {
                hooks.set(name, fn);
            },
        },
        fire: (name: string, payload?: unknown) => hooks.get(name)?.(payload as never),
    };
}

function createEvent(path: string, matchedRoute?: string): H3Event {
    return {
        path,
        method: "GET",
        context: matchedRoute === undefined ? {} : { matchedRoute: { path: matchedRoute } },
    } as unknown as H3Event;
}

// The plugin replaces `h3App.handler` in place, so what it installed is what a request goes through
function start(handle: Handler = () => BODY) {
    const nitroApp = createNitroApp(handle);

    plugin(nitroApp);

    return { nitroApp, handler: nitroApp.h3App.handler };
}

// Always a promise: the span callback is async, so a traced request is awaited whatever the inner
// handler returned
function traced(path: string, matchedRoute?: string, handler: Handler = () => BODY): Promise<unknown> {
    return start(handler).handler(createEvent(path, matchedRoute)) as Promise<unknown>;
}

// Never a promise of its own: the untraced path hands the inner handler's value straight back
function untraced(path: string): unknown {
    return start().handler(createEvent(path));
}

function spanCall() {
    return otel.tracer.startActiveSpan.mock.calls[0] as unknown as [
        string,
        { kind: SpanKind, attributes: Record<string, string | undefined> },
        string,
    ];
}

function attributes() {
    return otel.span.setAttributes.mock.calls[0]?.[0] as Record<string, string | number>;
}

beforeEach(() => {
    vi.clearAllMocks();

    runtimeConfig = createConfig();
    responseStatus = 200;

    telemetry.startNodeTelemetry.mockReturnValue(telemetry.provider);
    otel.getTracer.mockReturnValue(otel.tracer);
    otel.getActiveSpan.mockReturnValue(otel.span);
    otel.extract.mockReturnValue(PARENT);
    otel.active.mockReturnValue(ACTIVE);
    otel.tracer.startActiveSpan.mockImplementation(
        (_name: string, _options: object, _parent: string, run: (span: typeof otel.span) => unknown) => run(otel.span),
    );
});

describe("the nitro observability plugin", () => {
    // Local dev sets no collector URL, and the property worth keeping is that this costs nothing
    // rather than merely sending nowhere
    it("starts no exporter and leaves the handler alone when no collector URL is set", () => {
        runtimeConfig = createConfig("");

        const { nitroApp, handler } = start();

        expect(telemetry.startNodeTelemetry).not.toHaveBeenCalled();
        expect(handler).toBe(nitroApp.h3App.handler);

        // Returned as-is rather than awaited, so an untraced request costs no promise either
        expect(handler(createEvent("/articles"))).toBe(BODY);
        expect(otel.tracer.startActiveSpan).not.toHaveBeenCalled();
    });

    it("hands the collector credentials and the app identity to the exporter", () => {
        start();

        expect(telemetry.startNodeTelemetry).toHaveBeenCalledWith({
            url: COLLECTOR,
            instanceId: "123456",
            token: "glc_token",
            app: APP,
        });

        expect(otel.getTracer).toHaveBeenCalledWith(APP.name, APP.version);
    });

    it("returns the handler's body untouched", async () => {
        await expect(traced("/articles", "/articles")).resolves.toBe(BODY);
    });

    // Without the extracted parent every server span is its own root, and the browser trace that
    // caused it sits in a second, unrelated tree
    it("continues an incoming trace rather than opening a second one for the same request", async () => {
        await traced("/articles", "/articles");

        expect(otel.extract).toHaveBeenCalledWith(ACTIVE, { traceparent: TRACEPARENT });
        expect(spanCall()[2]).toBe(PARENT);
    });

    it("opens the request span as a server span, since no instrumentation will", async () => {
        await traced("/articles", "/articles");

        expect(spanCall()[1].kind).toBe(SpanKind.SERVER);
    });

    // The span opens under the concrete path because the route is not matched yet, so leaving it at
    // that would give every slug a span name of its own and make the operation unaggregatable
    it("renames the span to the matched route, so a path carrying an id cannot multiply span names", async () => {
        await traced("/articles/hello-world", "/articles/:slug");

        expect(spanCall()[0]).toBe("GET /articles/hello-world");
        expect(otel.span.updateName).toHaveBeenCalledWith("GET /articles/:slug");
        expect(attributes()[ATTR_HTTP_ROUTE]).toBe("/articles/:slug");
    });

    it("falls back to the request path when nothing matched, rather than leaving the span unnamed", async () => {
        await traced("/nope");

        expect(otel.span.updateName).toHaveBeenCalledWith("GET /nope");
        expect(attributes()[ATTR_HTTP_ROUTE]).toBe("/nope");
    });

    // A 404 is the one route that is never matched, so the fallback above is what a crawler hits.
    // With the query left on it, `?a=1` and `?a=2` are two operations and the keyspace is unbounded.
    it("strips the query off the fallback route, so an unmatched path cannot mint a name per query", async () => {
        await traced("/nope?a=1");

        expect(otel.span.updateName).toHaveBeenCalledWith("GET /nope");
        expect(attributes()[ATTR_HTTP_ROUTE]).toBe("/nope");
    });

    it("stamps the request attributes, keeping the query out of the path", async () => {
        await traced("/articles?page=2", "/articles");

        expect(spanCall()[1].attributes).toEqual({
            [ATTR_HTTP_REQUEST_METHOD]: "GET",
            [ATTR_URL_PATH]: "/articles",
            [ATTR_URL_QUERY]: "page=2",
            [ATTR_SERVER_ADDRESS]: "external.test",
            [ATTR_USER_AGENT_ORIGINAL]: USER_AGENT,
            [ATTR_CLIENT_ADDRESS]: CLIENT_IP,
        });
    });

    it("records the response status and closes the span", async () => {
        responseStatus = 201;

        await traced("/articles", "/articles");

        expect(attributes()[ATTR_HTTP_RESPONSE_STATUS_CODE]).toBe(201);
        expect(otel.span.end).toHaveBeenCalledOnce();
    });

    describe("when the response is a failure", () => {
        // A 4xx is the caller's fault. Marking it ERROR makes an error rate that no deploy can fix.
        it.each([400, 404, 499])("leaves %i unmarked, since the client is what went wrong", async (status) => {
            responseStatus = status;

            await traced("/nope", "/nope");

            expect(otel.span.setStatus).not.toHaveBeenCalled();
            expect(otel.span.end).toHaveBeenCalledOnce();
        });

        it.each([500, 502, 503])("marks %i as a failed span", async (status) => {
            responseStatus = status;

            await traced("/articles", "/articles");

            expect(otel.span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
        });
    });

    describe("when the handler throws", () => {
        const cause = Object.assign(new Error("upstream down"), { statusCode: 502 });

        it("rethrows, so a traced request is still a handled one", async () => {
            await expect(traced("/articles", "/articles", () => Promise.reject(cause))).rejects.toBe(cause);
        });

        it("records the exception and closes the span with the status the error carries", async () => {
            await expect(traced("/articles", "/articles", () => Promise.reject(cause))).rejects.toBe(cause);

            expect(otel.span.recordException).toHaveBeenCalledWith(cause);
            expect(attributes()[ATTR_HTTP_RESPONSE_STATUS_CODE]).toBe(502);
            expect(otel.span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
            expect(otel.span.end).toHaveBeenCalledOnce();
        });

        // An error with no status is ours, not the caller's, so it must not read as a 200
        it("closes the span as a 500 when the error carries no status", async () => {
            const boom = new Error("boom");

            await expect(traced("/articles", "/articles", () => Promise.reject(boom))).rejects.toBe(boom);

            expect(attributes()[ATTR_HTTP_RESPONSE_STATUS_CODE]).toBe(500);
        });
    });

    // Left untraced on purpose: an asset request per page view would outnumber the requests worth
    // looking at, and every one of them would carry a hashed filename of its own
    it.each([
        "/_nuxt/entry.abc123.js",
        "/_fonts/inter.woff2",
        "/__nuxt/island",
        "/favicon.ico",
    ])("does not trace %s", (path) => {
        // Handed straight back, not awaited: the untraced path adds no promise to an asset request
        expect(untraced(path)).toBe(BODY);

        expect(otel.tracer.startActiveSpan).not.toHaveBeenCalled();
    });

    // Nitro reports errors it handled itself through this hook, which never reaches the try/catch above
    it("records an error reported through Nitro's hook on the span that is open", () => {
        const error = new Error("render failed");

        start().nitroApp.fire("error", error);

        expect(otel.span.recordException).toHaveBeenCalledWith(error);
    });

    it("survives an error reported with no span open", () => {
        otel.getActiveSpan.mockReturnValue(undefined);

        expect(() => start().nitroApp.fire("error", new Error("render failed"))).not.toThrow();
    });

    // The exporter batches, so without this the spans from the last seconds before a deploy are lost
    it("shuts the exporter down when Nitro closes, so buffered spans are flushed", () => {
        start().nitroApp.fire("close");

        expect(telemetry.provider.shutdown).toHaveBeenCalledOnce();
    });
});
