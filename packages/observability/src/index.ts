import { getWebInstrumentations, initializeFaro, type Faro } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";

export type WebTelemetryConfig = {
    url: string

    app: {
        name: string
        version: string
        environment: string
    }
};

export function startWebTelemetry({ url, app }: WebTelemetryConfig): Faro {
    return initializeFaro({
        url,
        app,
        instrumentations: [...getWebInstrumentations(), new TracingInstrumentation()],
    });
}
