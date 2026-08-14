import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { UndiciInstrumentation } from "@opentelemetry/instrumentation-undici";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
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

    ignoreUrl?: (url: string) => boolean
};

export function startNodeTelemetry({ url, instanceId, token, app, ignoreUrl }: NodeTelemetryConfig): NodeSDK {
    process.env.OTEL_METRICS_EXPORTER ??= "none";
    process.env.OTEL_LOGS_EXPORTER ??= "none";

    const sdk = new NodeSDK({
        resource: resourceFromAttributes({
            [ATTR_SERVICE_NAME]: app.name,
            [ATTR_SERVICE_VERSION]: app.version,
            [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: app.environment,
        }),
        traceExporter: new OTLPTraceExporter({
            url: `${url.replace(/\/$/, "")}/v1/traces`,
            headers: { Authorization: `Basic ${Buffer.from(`${instanceId}:${token}`).toString("base64")}` },
        }),
        instrumentations: [
            new HttpInstrumentation({
                ignoreIncomingRequestHook: ({ url }) => ignore(url, ignoreUrl),
            }),
            new UndiciInstrumentation({
                ignoreRequestHook: ({ path }) => ignore(path, ignoreUrl),
            }),
        ],
    });

    sdk.start();

    return sdk;
}

function ignore(url: string | undefined, ignoreUrl: NodeTelemetryConfig["ignoreUrl"]): boolean {
    return !!url && ignoreUrl?.(url) === true;
}
