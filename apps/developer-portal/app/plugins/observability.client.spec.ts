import { beforeEach, describe, expect, it, vi } from "vitest";

const telemetry = vi.hoisted(() => ({
    startWebTelemetry: vi.fn(),
    pushError: vi.fn(),
}));

vi.mock("@monorepo/observability", () => ({ startWebTelemetry: telemetry.startWebTelemetry }));

const config = {
    url: "https://collector.example/collect/key",
    app: {
        name: "@monorepo/developer-portal",
        version: "1.2.3",
        environment: "production",
    },
};

async function loadPlugin(observability: typeof config) {
    useRuntimeConfig().public.observability = observability;
    telemetry.startWebTelemetry.mockReturnValue({ api: { pushError: telemetry.pushError } });

    return (await import("./observability.client")).default;
}

function runPlugin(plugin: Awaited<ReturnType<typeof loadPlugin>>, hook: (name: string, callback: (error: unknown) => void) => unknown): void {
    const run = plugin as unknown as (nuxtApp: { hook: typeof hook }) => void;

    run({ hook });
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("observability.client", () => {
    it("does not initialize Faro or register an error hook without a collector URL", async () => {
        const plugin = await loadPlugin({ ...config, url: "" });
        const hook = vi.fn();

        runPlugin(plugin, hook);

        expect(telemetry.startWebTelemetry).not.toHaveBeenCalled();
        expect(hook).not.toHaveBeenCalled();
    });

    it("passes the public runtime configuration to Faro once when enabled", async () => {
        const plugin = await loadPlugin(config);

        runPlugin(plugin, vi.fn());

        expect(telemetry.startWebTelemetry).toHaveBeenCalledTimes(1);
        expect(telemetry.startWebTelemetry).toHaveBeenCalledWith(config);
    });

    it("forwards Vue render errors to Faro", async () => {
        const plugin = await loadPlugin(config);
        let onVueError: ((error: unknown) => void) | undefined;
        const hook = vi.fn((name: string, callback: (error: unknown) => void) => {
            if (name === "vue:error") onVueError = callback;
        });
        const error = new Error("render failed");

        runPlugin(plugin, hook);
        onVueError?.(error);

        expect(hook).toHaveBeenCalledWith("vue:error", expect.any(Function));
        expect(telemetry.pushError).toHaveBeenCalledWith(error);
    });
});
