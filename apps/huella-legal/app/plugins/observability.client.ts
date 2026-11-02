import type { startWebTelemetry } from "@monorepo/observability";

type Faro = ReturnType<typeof startWebTelemetry>;

export default defineNuxtPlugin((nuxtApp) => {
    const { observability } = useRuntimeConfig().public;

    if (!observability.url) return;

    let faro: Faro | undefined;
    const earlyErrors: Error[] = [];

    nuxtApp.hook("vue:error", (error) => {
        if (faro) faro.api.pushError(error as Error);
        else earlyErrors.push(error as Error);
    });

    onNuxtReady(async () => {
        const telemetry = await import("@monorepo/observability");

        faro = telemetry.startWebTelemetry(observability);
        for (const error of earlyErrors.splice(0)) faro.api.pushError(error);
    });
});
