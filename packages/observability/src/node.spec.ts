import { beforeEach, describe, expect, it, vi } from "vitest";
import { startNodeTelemetry } from "./node";

const provider = vi.hoisted(() => {
    const instance = { register: vi.fn() };

    return {
        instance,
        NodeTracerProvider: vi.fn<(config: object) => typeof instance>(function () {
            return instance;
        }),
    };
});

const exporter = vi.hoisted(() => ({ OTLPTraceExporter: vi.fn() }));
const processor = vi.hoisted(() => ({ BatchSpanProcessor: vi.fn() }));
const undici = vi.hoisted(() => ({ UndiciInstrumentation: vi.fn() }));
const autoLoader = vi.hoisted(() => ({ registerInstrumentations: vi.fn() }));

vi.mock("@opentelemetry/sdk-trace-node", () => ({ NodeTracerProvider: provider.NodeTracerProvider }));
vi.mock("@opentelemetry/sdk-trace-base", () => ({ BatchSpanProcessor: processor.BatchSpanProcessor }));
vi.mock("@opentelemetry/exporter-trace-otlp-proto", () => ({ OTLPTraceExporter: exporter.OTLPTraceExporter }));
vi.mock("@opentelemetry/instrumentation-undici", () => ({ UndiciInstrumentation: undici.UndiciInstrumentation }));
vi.mock("@opentelemetry/instrumentation", () => ({ registerInstrumentations: autoLoader.registerInstrumentations }));

const url = "https://otlp-gateway-prod-eu-west-0.grafana.net/otlp";
const app = { name: "@monorepo/external", version: "1.0.0", environment: "production" };

type Config = Parameters<typeof startNodeTelemetry>[0];

function start(config: Partial<Config> = {}) {
    return startNodeTelemetry({ url, instanceId: "123456", token: "glc_token", app, ...config });
}

function exporterOptions() {
    return exporter.OTLPTraceExporter.mock.calls[0][0] as { url: string, headers: Record<string, string> };
}

function providerOptions() {
    return provider.NodeTracerProvider.mock.calls[0][0] as { resource: { attributes: Record<string, string> } };
}

beforeEach(() => {
    vi.clearAllMocks();
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

        expect(providerOptions().resource.attributes).toMatchObject({
            "service.name": app.name,
            "service.version": app.version,
            "deployment.environment.name": app.environment,
        });
    });

    it("instruments outbound fetches, the half of a server trace the caller cannot open itself", () => {
        start();

        expect(undici.UndiciInstrumentation).toHaveBeenCalledOnce();
        expect(autoLoader.registerInstrumentations).toHaveBeenCalledWith({
            instrumentations: [undici.UndiciInstrumentation.mock.instances[0]],
        });
    });

    it("registers itself globally, so a caller's trace.getTracer() reaches this provider", () => {
        start();

        expect(provider.instance.register).toHaveBeenCalledOnce();
    });

    it("returns the provider, so the caller can flush it on shutdown", () => {
        const started: unknown = start();

        expect(started).toBe(provider.instance);
    });
});
