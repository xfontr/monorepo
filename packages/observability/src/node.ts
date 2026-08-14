import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { UndiciInstrumentation } from "@opentelemetry/instrumentation-undici";
import { defaultResource, resourceFromAttributes } from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import {
    ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
    ATTR_SERVICE_NAME,
    ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

export type NodeTelemetryConfig = {
    url: string
    instanceId: string
    token: string

    app: {
        name: string
        version: string
        environment: string
    }
};

export function startNodeTelemetry({ url, instanceId, token, app }: NodeTelemetryConfig): NodeTracerProvider {
    const provider = new NodeTracerProvider({
        resource: defaultResource().merge(resourceFromAttributes({
            [ATTR_SERVICE_NAME]: app.name,
            [ATTR_SERVICE_VERSION]: app.version,
            [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: app.environment,
        })),
        spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter({
            url: `${url.replace(/\/$/, "")}/v1/traces`,
            headers: { Authorization: `Basic ${Buffer.from(`${instanceId}:${token}`).toString("base64")}` },
        }))],
    });

    // Also installs the W3C propagator and the async context manager the caller's spans need.
    provider.register();

    registerInstrumentations({ instrumentations: [new UndiciInstrumentation()] });

    return provider;
}
