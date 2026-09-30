import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import plugin from "./observability.client";

const telemetry = vi.hoisted(() => ({
    faro: { api: { pushError: vi.fn() } },
    startWebTelemetry: vi.fn(),
    config: { url: "", app: { name: "@monorepo/huella-legal", version: "1.4.0", environment: "production" } },
}));

vi.mock("@monorepo/observability", () => ({ startWebTelemetry: telemetry.startWebTelemetry }));

// Wraps the real config rather than replacing it, because Nuxt's own plugins read it while booting
mockNuxtImport("useRuntimeConfig", (original) => () => {
    const config = original();

    return { ...config, public: { ...config.public, observability: telemetry.config } };
});

const COLLECTOR = "https://faro-collector.test/collect";

function run() {
    const hooks = new Map<string, (error: unknown) => void>();
    const nuxtApp = { hook: (name: string, fn: (error: unknown) => void) => hooks.set(name, fn) };

    (plugin as unknown as (app: typeof nuxtApp) => void)(nuxtApp);

    return hooks;
}

beforeEach(() => {
    vi.clearAllMocks();

    telemetry.config.url = "";
    telemetry.startWebTelemetry.mockReturnValue(telemetry.faro);
});

describe("the browser observability plugin", () => {
    it("starts no telemetry and hooks nothing when no collector URL is set", () => {
        const hooks = run();

        expect(telemetry.startWebTelemetry).not.toHaveBeenCalled();
        expect(hooks.size).toBe(0);
    });

    it("hands the public observability config to Faro", () => {
        telemetry.config.url = COLLECTOR;

        run();

        expect(telemetry.startWebTelemetry).toHaveBeenCalledWith(telemetry.config);
    });

    it("forwards every Vue error to Faro, so a render crash is not lost in the console", () => {
        telemetry.config.url = COLLECTOR;
        const error = new Error("render failed");

        run().get("vue:error")?.(error);

        expect(telemetry.faro.api.pushError).toHaveBeenCalledWith(error);
    });
});
