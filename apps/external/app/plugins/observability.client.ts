import { startWebTelemetry } from "@monorepo/observability";

export default defineNuxtPlugin((nuxtApp) => {
    const { observability } = useRuntimeConfig().public;

    if (!observability.url) return;

    const faro = startWebTelemetry(observability);

    nuxtApp.hook("vue:error", (error) => {
        faro.api.pushError(error as Error);
    });

    return { provide: { faro } };
});
