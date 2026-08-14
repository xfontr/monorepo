import { beforeEach, describe, expect, it, vi } from "vitest";
import { startNodeTelemetry } from "./node";

const sdk = vi.hoisted(() => {
    const instance = { start: vi.fn() };

    return {
        instance,
        NodeSDK: vi.fn<(config: object) => typeof instance>(function () {
            return instance;
        }),
    };
});

const exporter = vi.hoisted(() => ({ OTLPTraceExporter: vi.fn() }));
const http = vi.hoisted(() => ({ HttpInstrumentation: vi.fn() }));
const undici = vi.hoisted(() => ({ UndiciInstrumentation: vi.fn() }));

vi.mock("@opentelemetry/sdk-node", () => ({ NodeSDK: sdk.NodeSDK }));
vi.mock("@opentelemetry/exporter-trace-otlp-proto", () => ({ OTLPTraceExporter: exporter.OTLPTraceExporter }));
vi.mock("@opentelemetry/instrumentation-http", () => ({ HttpInstrumentation: http.HttpInstrumentation }));
vi.mock("@opentelemetry/instrumentation-undici", () => ({ UndiciInstrumentation: undici.UndiciInstrumentation }));

const url = "https://otlp-gateway-prod-eu-west-0.grafana.net/otlp";
const app = { name: "@monorepo/external", version: "1.0.0", environment: "production" };

type Config = Parameters<typeof startNodeTelemetry>[0];

function start(config: Partial<Config> = {}) {
    return startNodeTelemetry({ url, instanceId: "123456", token: "glc_token", app, ...config });
}

function exporterOptions() {
    return exporter.OTLPTraceExporter.mock.calls[0][0] as { url: string, headers: Record<string, string> };
}

function sdkOptions() {
    return sdk.NodeSDK.mock.calls[0][0] as {
        resource: { attributes: Record<string, string> }
        instrumentations: unknown[]
    };
}

function ignoreHooks() {
    const { ignoreIncomingRequestHook } = http.HttpInstrumentation.mock.calls[0][0] as {
        ignoreIncomingRequestHook: (request: { url?: string }) => boolean
    };

    const { ignoreRequestHook } = undici.UndiciInstrumentation.mock.calls[0][0] as {
        ignoreRequestHook: (request: { path: string }) => boolean
    };

    return { ignoreIncomingRequestHook, ignoreRequestHook };
}

beforeEach(() => {
    vi.clearAllMocks();

    delete process.env.OTEL_METRICS_EXPORTER;
    delete process.env.OTEL_LOGS_EXPORTER;
});

describe("startNodeTelemetry", () => {
    it("exports traces to the collector's trace signal, whether or not the URL ends in a slash", () => {
        start({ url: `${url}/` });

        expect(exporterOptions().url).toBe(`${url}/v1/traces`);
    });

    it("authenticates with the instance and token as basic credentials", () => {
        start();

        expect(exporterOptions().headers).toEqual({
            Authorization: `Basic ${Buffer.from("123456:glc_token").toString("base64")}`,
        });
    });

    it("stamps every span with the app that emitted it, so a release can be told from the one before", () => {
        start();

        expect(sdkOptions().resource.attributes).toMatchObject({
            "service.name": app.name,
            "service.version": app.version,
            "deployment.environment.name": app.environment,
        });
    });

    it("instruments inbound requests and outbound fetches, the two halves of a server trace", () => {
        start();

        expect(http.HttpInstrumentation).toHaveBeenCalledOnce();
        expect(undici.UndiciInstrumentation).toHaveBeenCalledOnce();
        expect(sdkOptions().instrumentations).toHaveLength(2);
    });

    it("keeps the URLs the caller wants ignored out of both instrumentations", () => {
        start({ ignoreUrl: (url) => url.startsWith("/_nuxt") });

        const { ignoreIncomingRequestHook, ignoreRequestHook } = ignoreHooks();

        expect(ignoreIncomingRequestHook({ url: "/_nuxt/entry.js" })).toBe(true);
        expect(ignoreIncomingRequestHook({ url: "/api/translations/en-GB" })).toBe(false);
        expect(ignoreRequestHook({ path: "/_nuxt/entry.js" })).toBe(true);
    });

    it("traces everything when the caller ignores nothing", () => {
        start();

        const { ignoreIncomingRequestHook } = ignoreHooks();

        expect(ignoreIncomingRequestHook({ url: "/" })).toBe(false);
        expect(ignoreIncomingRequestHook({})).toBe(false);
    });

    it("sends traces only, so no exporter is left pointing at a collector that is not there", () => {
        start();

        expect(process.env.OTEL_METRICS_EXPORTER).toBe("none");
        expect(process.env.OTEL_LOGS_EXPORTER).toBe("none");
    });

    it("leaves the other signals alone when the environment already asked for them", () => {
        process.env.OTEL_METRICS_EXPORTER = "otlp";

        start();

        expect(process.env.OTEL_METRICS_EXPORTER).toBe("otlp");
    });

    it("starts the SDK and returns it, so the caller can flush it on shutdown", () => {
        const started: unknown = start();

        expect(sdk.instance.start).toHaveBeenCalledOnce();
        expect(started).toBe(sdk.instance);
    });
});
