import { startNodeTelemetry } from "@monorepo/observability/node";
import { context, propagation, SpanKind, SpanStatusCode, trace, type Span } from "@opentelemetry/api";
import {
    ATTR_CLIENT_ADDRESS,
    ATTR_HTTP_REQUEST_METHOD,
    ATTR_HTTP_RESPONSE_STATUS_CODE,
    ATTR_HTTP_ROUTE,
    ATTR_SERVER_ADDRESS,
    ATTR_URL_PATH,
    ATTR_URL_QUERY,
    ATTR_USER_AGENT_ORIGINAL,
} from "@opentelemetry/semantic-conventions";
import type { H3Event } from "h3";

const UNTRACED = ["/_nuxt", "/_fonts", "/__nuxt", "/favicon.ico"];

const isUntraced = (url: string) => UNTRACED.some((path) => url.startsWith(path));

export default defineNitroPlugin((nitroApp) => {
    const { observability, public: { observability: { app } } } = useRuntimeConfig();

    if (!observability.url) return;

    const sdk = startNodeTelemetry({ ...observability, app, ignoreUrl: isUntraced });
    const tracer = trace.getTracer(app.name, app.version);
    const handle = nitroApp.h3App.handler;

    nitroApp.h3App.handler = defineEventHandler((event) => {
        if (isUntraced(event.path)) return handle(event);

        const parent = propagation.extract(context.active(), getRequestHeaders(event));
        const options = { kind: SpanKind.SERVER, attributes: requestAttributes(event) };

        return tracer.startActiveSpan(`${event.method} ${event.path}`, options, parent, async (span) => {
            try {
                const body = await handle(event);
                end(span, event, getResponseStatus(event));

                return body;
            }
            catch (error) {
                span.recordException(error as Error);
                end(span, event, createError(error as Error).statusCode);

                throw error;
            }
        });
    });

    nitroApp.hooks.hook("error", (error) => {
        trace.getActiveSpan()?.recordException(error);
    });

    nitroApp.hooks.hook("close", () => sdk.shutdown());
});

// #region utils
function requestAttributes(event: H3Event) {
    const [path, query] = event.path.split("?");

    return {
        [ATTR_HTTP_REQUEST_METHOD]: event.method,
        [ATTR_URL_PATH]: path,
        [ATTR_URL_QUERY]: query,
        [ATTR_SERVER_ADDRESS]: getRequestHost(event),
        [ATTR_USER_AGENT_ORIGINAL]: getRequestHeader(event, "user-agent"),
        [ATTR_CLIENT_ADDRESS]: getRequestIP(event, { xForwardedFor: true }),
    };
}

function end(span: Span, event: H3Event, status: number) {
    const route = event.context.matchedRoute?.path ?? event.path;

    span.updateName(`${event.method} ${route}`);
    span.setAttributes({ [ATTR_HTTP_ROUTE]: route, [ATTR_HTTP_RESPONSE_STATUS_CODE]: status });

    if (status >= 500) span.setStatus({ code: SpanStatusCode.ERROR });

    span.end();
}
// #endregion
