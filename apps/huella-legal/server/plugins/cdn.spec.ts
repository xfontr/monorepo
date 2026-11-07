import { beforeEach, describe, expect, it, vi } from "vitest";
import type { H3Event } from "h3";

type ErrorHook = (error: Error, context: { event?: H3Event; tags?: string[] }) => void;

const setResponseHeader = vi.fn();

vi.stubGlobal("defineNitroPlugin", (plugin: unknown) => plugin);
vi.stubGlobal("setResponseHeader", setResponseHeader);

const plugin = (await import("./cdn")).default as unknown as (nitroApp: unknown) => void;

const EVENT = { method: "GET", path: "/la-culpa/" } as H3Event;

const start = (): ErrorHook => {
    let hook: ErrorHook | undefined;

    plugin({ hooks: { hook: (_name: string, fn: ErrorHook) => (hook = fn) } });

    return hook!;
};

const httpError = (fields: Record<string, unknown>) =>
    Object.assign(new Error("Upstream request failed"), fields);

beforeEach(() => {
    setResponseHeader.mockClear();
});

describe("the CDN cache plugin", () => {
    // The route's isr rule would otherwise keep a WordPress outage on the page for a day
    it.each([500, 502, 503])("keeps a %i out of Netlify's cache", (statusCode) => {
        start()(httpError({ statusCode }), { event: EVENT, tags: ["request"] });

        expect(setResponseHeader).toHaveBeenCalledExactlyOnceWith(
            EVENT,
            "netlify-cdn-cache-control",
            "no-store",
        );
    });

    it("treats an error with no status as a 500", () => {
        start()(new Error("boom"), { event: EVENT, tags: ["request"] });

        expect(setResponseHeader).toHaveBeenCalledOnce();
    });

    it.each([404, 422])(
        "lets a %i be cached, since the caller's request is what failed",
        (statusCode) => {
            start()(httpError({ statusCode }), { event: EVENT, tags: ["request"] });

            expect(setResponseHeader).not.toHaveBeenCalled();
        },
    );

    it("leaves an error raised outside a request alone, since it has no response", () => {
        start()(httpError({ statusCode: 500 }), { tags: ["plugin"] });

        expect(setResponseHeader).not.toHaveBeenCalled();
    });
});
