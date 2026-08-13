import { beforeEach, describe, expect, it, vi } from "vitest";
import { startWebTelemetry } from "./index";

const faro = vi.hoisted(() => ({
    initializeFaro: vi.fn(),
    getWebInstrumentations: vi.fn(() => [{ name: "web" }]),
}));

const tracing = vi.hoisted(() => ({ TracingInstrumentation: vi.fn() }));

vi.mock("@grafana/faro-web-sdk", () => ({
    initializeFaro: faro.initializeFaro,
    getWebInstrumentations: faro.getWebInstrumentations,
}));

vi.mock("@grafana/faro-web-tracing", () => ({ TracingInstrumentation: tracing.TracingInstrumentation }));

const url = "https://faro-collector.grafana.net/collect/abc123";
const app = { name: "@monorepo/external", version: "1.0.0", environment: "production" };

function start() {
    return startWebTelemetry({ url, app });
}

function instrumentations() {
    return (faro.initializeFaro.mock.calls[0][0] as { instrumentations: unknown[] }).instrumentations;
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("startWebTelemetry", () => {
    it("initializes Faro against the collector, identifying the app that is reporting", () => {
        start();

        expect(faro.initializeFaro).toHaveBeenCalledWith(expect.objectContaining({ url, app }) as object);
    });

    it("keeps the default web instrumentations, so errors and web vitals arrive without extra wiring", () => {
        start();

        expect(instrumentations()).toContainEqual({ name: "web" });
    });

    it("adds tracing, so a browser action and the requests it makes end up on one trace", () => {
        start();

        expect(tracing.TracingInstrumentation).toHaveBeenCalledOnce();
        expect(instrumentations()).toHaveLength(2);
    });

    it("returns the Faro instance, so a caller can push logs and errors to it", () => {
        const instance = { api: {} };
        faro.initializeFaro.mockReturnValue(instance);

        expect(start()).toBe(instance);
    });
});
