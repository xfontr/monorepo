import { startNodeTelemetry } from "@monorepo/observability/node";
import { getContext } from "@netlify/functions";
import {
    context,
    propagation,
    SpanKind,
    SpanStatusCode,
    trace,
    type Span,
} from "@opentelemetry/api";
import {
    ATTR_HTTP_REQUEST_METHOD,
    ATTR_HTTP_RESPONSE_STATUS_CODE,
    ATTR_HTTP_ROUTE,
    ATTR_SERVER_ADDRESS,
    ATTR_URL_PATH,
} from "@opentelemetry/semantic-conventions";
import type { H3Event } from "h3";

const UNTRACED = ["/_nuxt", "/_fonts", "/__nuxt", "/favicon.ico"];

const isUntraced = (url: string) => UNTRACED.some((path) => url.startsWith(path));

// No client IP, user agent or query: they are the reader's personal data, and Grafana is a third party
const requestAttributes = (event: H3Event) => ({
    [ATTR_HTTP_REQUEST_METHOD]: event.method,
    [ATTR_URL_PATH]: event.path.split("?")[0],
    [ATTR_SERVER_ADDRESS]: getRequestHost(event),
});

const recordError = (span: Span, error: Error) => {
    span.recordException(error);

    if (error.cause instanceof Error && error.cause !== error) span.recordException(error.cause);
};

const end = (span: Span, event: H3Event, status: number) => {
    const [path] = event.path.split("?");
    const route = event.context.matchedRoute?.path ?? path;

    span.updateName(`${event.method} ${route}`);
    span.setAttributes({ [ATTR_HTTP_ROUTE]: route, [ATTR_HTTP_RESPONSE_STATUS_CODE]: status });

    if (status >= 500) span.setStatus({ code: SpanStatusCode.ERROR });

    span.end();
};

export default defineNitroPlugin((nitroApp) => {
    const {
        observability,
        public: {
            observability: { app },
        },
    } = useRuntimeConfig();

    // Nitro inlines `process.env.prerender` at build time, and a build never has the OTLP token
    // because Netlify withholds secret values from CLI builds
    if (!observability.url || process.env.prerender) return;

    const provider = startNodeTelemetry({ ...observability, app });
    const tracer = trace.getTracer(app.name, app.version);
    const handle = nitroApp.h3App.handler;

    // Netlify freezes the function once it responds, which would strand the batch until a later thaw
    const flush = () => {
        try {
            getContext().waitUntil(provider.forceFlush());
        } catch {
            // Off Netlify there is no request context, and the batch's own timer exports instead
        }
    };

    nitroApp.h3App.handler = defineEventHandler((event) => {
        if (isUntraced(event.path)) return handle(event);

        const parent = propagation.extract(context.active(), getRequestHeaders(event));
        const options = { kind: SpanKind.SERVER, attributes: requestAttributes(event) };

        return tracer.startActiveSpan(
            `${event.method} ${event.path}`,
            options,
            parent,
            async (span) => {
                try {
                    const body = await handle(event);
                    end(span, event, getResponseStatus(event));

                    return body;
                } catch (error) {
                    recordError(span, error as Error);
                    end(span, event, createError(error as Error).statusCode);

                    throw error;
                } finally {
                    flush();
                }
            },
        );
    });

    nitroApp.hooks.hook("error", (error) => {
        const span = trace.getActiveSpan();

        if (span) recordError(span, error);
    });

    nitroApp.hooks.hook("close", () => provider.shutdown());
});
