import { getWebInstrumentations, initializeFaro, type Faro } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";

export interface WebTelemetryConfig {
    url: string;

    app: {
        name: string;
        version: string;
        environment: string;
    };
}

export const startWebTelemetry = ({ url, app }: WebTelemetryConfig): Faro =>
    initializeFaro({
        url,
        app,
        instrumentations: [...getWebInstrumentations(), new TracingInstrumentation()],
    });
