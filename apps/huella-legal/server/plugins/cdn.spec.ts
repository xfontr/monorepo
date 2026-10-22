import { beforeEach, describe, expect, it, vi } from "vitest";
import type { H3Event } from "h3";

type ErrorHook = (error: Error, context: { event?: H3Event; tags?: string[] }) => void;

const setResponseHeader = vi.hoisted(() => vi.fn());

vi.stubGlobal("defineNitroPlugin", (plugin: unknown) => plugin);
vi.stubGlobal("setResponseHeader", setResponseHeader);

const plugin = (await import("./cdn")).default as unknown as (nitroApp: unknown) => void;

const event = (headersSent = false) =>
    ({ path: "/hola/", node: { res: { headersSent } } }) as unknown as H3Event;

const EVENT = event();
const REQUEST = { event: EVENT, tags: ["request"] };

const start = (): ErrorHook => {
    let hook: ErrorHook | undefined;

    plugin({ hooks: { hook: (_name: string, fn: ErrorHook) => (hook = fn) } });

    return hook!;
};

const httpError = (statusCode: number) => Object.assign(new Error("boom"), { statusCode });

beforeEach(() => {
    vi.clearAllMocks();
});

describe("the nitro cdn plugin", () => {
    // Guards against a CDN that negatively caches errors it receives without directives
    it.each([500, 502, 503])("keeps a %i out of any shared cache", (statusCode) => {
        start()(httpError(statusCode), REQUEST);

        expect(setResponseHeader).toHaveBeenCalledWith(EVENT, "cache-control", "no-store");
    });

    it("treats an error with no status as a 500 rather than letting it be cached", () => {
        start()(new Error("boom"), REQUEST);

        expect(setResponseHeader).toHaveBeenCalledWith(EVENT, "cache-control", "no-store");
    });

    it.each([400, 404])("leaves a %i to the route's own headers", (statusCode) => {
        start()(httpError(statusCode), REQUEST);

        expect(setResponseHeader).not.toHaveBeenCalled();
    });

    it("does not throw on an error raised outside a request", () => {
        start()(new Error("boom"), {});

        expect(setResponseHeader).not.toHaveBeenCalled();
    });

    // A background SWR refresh reports through the same hook after its response has gone out
    it("leaves a cache refresh failure alone instead of writing to a sent response", () => {
        start()(httpError(502), { event: EVENT, tags: ["cache"] });

        expect(setResponseHeader).not.toHaveBeenCalled();
    });

    it("never sets a header once the response is sent, which would throw ERR_HTTP_HEADERS_SENT", () => {
        start()(httpError(500), { event: event(true), tags: ["request"] });

        expect(setResponseHeader).not.toHaveBeenCalled();
    });
});
