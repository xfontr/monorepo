import type { startWebTelemetry } from "@monorepo/observability";

type Faro = ReturnType<typeof startWebTelemetry>;

export default defineNuxtPlugin((nuxtApp) => {
    const { observability } = useRuntimeConfig().public;

    if (!observability.url) return;

    let faro: Faro | undefined;
    const early: Error[] = [];

    nuxtApp.hook("vue:error", (error) => {
        if (faro) faro.api.pushError(error as Error);
        else early.push(error as Error);
    });

    // Imported statically, Faro and its tracing land in the entry chunk and run during hydration
    onNuxtReady(async () => {
        const telemetry = await import("@monorepo/observability");

        faro = telemetry.startWebTelemetry(observability);
        for (const error of early.splice(0)) faro.api.pushError(error);
    });
});
