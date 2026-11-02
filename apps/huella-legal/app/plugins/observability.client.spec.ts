import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import plugin from "./observability.client";

const telemetry = vi.hoisted(() => ({
    faro: { api: { pushError: vi.fn() } },
    startWebTelemetry: vi.fn(),
    ready: undefined as (() => void) | undefined,
    config: {
        url: "",
        app: { name: "@monorepo/huella-legal", version: "1.4.0", environment: "production" },
    },
}));

vi.mock("@monorepo/observability", () => ({ startWebTelemetry: telemetry.startWebTelemetry }));

// Wraps the real config rather than replacing it, because Nuxt's own plugins read it while booting
mockNuxtImport("useRuntimeConfig", (original) => () => {
    const config = original();

    return { ...config, public: { ...config.public, observability: telemetry.config } };
});

mockNuxtImport("onNuxtReady", () => (callback: () => void) => {
    telemetry.ready = callback;
});

const COLLECTOR = "https://faro-collector.test/collect";
const IDLE_START_MS = 10_000;

const run = () => {
    const hooks = new Map<string, (error: unknown) => void>();
    const nuxtApp = { hook: (name: string, fn: (error: unknown) => void) => hooks.set(name, fn) };

    (plugin as unknown as (app: typeof nuxtApp) => void)(nuxtApp);

    return hooks;
};

const started = () => vi.waitFor(() => expect(telemetry.startWebTelemetry).toHaveBeenCalled());

const startByWaiting = async () => {
    telemetry.ready?.();
    await vi.advanceTimersByTimeAsync(IDLE_START_MS);
    await started();
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    telemetry.config.url = "";
    telemetry.ready = undefined;
    telemetry.startWebTelemetry.mockReturnValue(telemetry.faro);
});

afterEach(() => {
    vi.useRealTimers();
});

describe("the browser observability plugin", () => {
    it("starts no telemetry and hooks nothing when no collector URL is set", () => {
        const hooks = run();

        expect(telemetry.startWebTelemetry).not.toHaveBeenCalled();
        expect(hooks.size).toBe(0);
    });

    it("holds Faro back while the page sits untouched, so a lab trace never loads it", async () => {
        telemetry.config.url = COLLECTOR;

        run();
        telemetry.ready?.();
        await vi.advanceTimersByTimeAsync(IDLE_START_MS - 1);

        expect(telemetry.startWebTelemetry).not.toHaveBeenCalled();
    });

    it("hands the public observability config to Faro on the reader's first interaction", async () => {
        telemetry.config.url = COLLECTOR;

        run();
        telemetry.ready?.();
        window.dispatchEvent(new PointerEvent("pointerdown"));
        await started();

        expect(telemetry.startWebTelemetry).toHaveBeenCalledWith(telemetry.config);
    });

    it("starts Faro anyway once the page has sat idle, so a reader who only reads is counted", async () => {
        telemetry.config.url = COLLECTOR;

        run();
        await startByWaiting();

        expect(telemetry.startWebTelemetry).toHaveBeenCalledWith(telemetry.config);
    });

    it("starts Faro once however many triggers fire, so no session is reported twice", async () => {
        telemetry.config.url = COLLECTOR;

        run();
        telemetry.ready?.();
        window.dispatchEvent(new KeyboardEvent("keydown"));
        window.dispatchEvent(new PointerEvent("pointerdown"));
        await vi.advanceTimersByTimeAsync(IDLE_START_MS);
        await started();

        expect(telemetry.startWebTelemetry).toHaveBeenCalledOnce();
    });

    it("forwards every Vue error to Faro, so a render crash is not lost in the console", async () => {
        telemetry.config.url = COLLECTOR;
        const error = new Error("render failed");
        const hooks = run();

        await startByWaiting();
        hooks.get("vue:error")?.(error);

        expect(telemetry.faro.api.pushError).toHaveBeenCalledWith(error);
    });

    it("keeps a Vue error thrown during hydration until Faro starts, rather than dropping it", async () => {
        telemetry.config.url = COLLECTOR;
        const error = new Error("hydration failed");

        run().get("vue:error")?.(error);
        await startByWaiting();

        expect(telemetry.faro.api.pushError).toHaveBeenCalledExactlyOnceWith(error);
    });
});
