import type { startWebTelemetry } from "@monorepo/observability";

type Faro = ReturnType<typeof startWebTelemetry>;

// Lighthouse stops tracing soon after the page goes quiet, so starting later keeps Faro out of it
const IDLE_START_MS = 10_000;
const INTERACTIONS = ["pointerdown", "keydown"] as const;

export default defineNuxtPlugin((nuxtApp) => {
    const { observability } = useRuntimeConfig().public;

    if (!observability.url) return;

    let faro: Faro | undefined;
    const earlyErrors: Error[] = [];

    nuxtApp.hook("vue:error", (error) => {
        if (faro) faro.api.pushError(error as Error);
        else earlyErrors.push(error as Error);
    });

    onNuxtReady(() => {
        const triggers = new AbortController();

        const start = async () => {
            if (triggers.signal.aborted) return;

            triggers.abort();

            const telemetry = await import("@monorepo/observability");

            faro = telemetry.startWebTelemetry(observability);
            for (const error of earlyErrors.splice(0)) faro.api.pushError(error);
        };

        const begin = () => void start();

        for (const type of INTERACTIONS)
            addEventListener(type, begin, { passive: true, signal: triggers.signal });

        setTimeout(begin, IDLE_START_MS);
    });
});
