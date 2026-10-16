import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { H3Event } from "h3";

type ErrorHook = (error: Error, context: { event?: H3Event; tags?: string[] }) => void;

vi.stubGlobal("defineNitroPlugin", (plugin: unknown) => plugin);

const plugin = (await import("./errorLog")).default as unknown as (nitroApp: unknown) => void;

const EVENT = { method: "GET", path: "/api/articles/hola" } as H3Event;
const REQUEST = { event: EVENT, tags: ["request"] };

const start = (): ErrorHook => {
    let hook: ErrorHook | undefined;

    plugin({ hooks: { hook: (_name: string, fn: ErrorHook) => (hook = fn) } });

    return hook!;
};

const httpError = (fields: Record<string, unknown>, cause?: Error) =>
    Object.assign(new Error("Upstream request failed", { cause }), fields);

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
    consoleError.mockRestore();
});

describe("the nitro error log plugin", () => {
    // A handled 502 answers the client with a generic message, so without this line the upstream
    // failure behind it is recorded nowhere
    it("logs a handled 5xx with the error that carries its cause", () => {
        const cause = new Error("connect ECONNREFUSED");
        const error = httpError({ statusCode: 502 }, cause);

        start()(error, REQUEST);

        expect(consoleError).toHaveBeenCalledOnce();
        expect(consoleError.mock.calls[0]?.[0]).toContain("[GET] /api/articles/hola");
        expect(consoleError.mock.calls[0]?.[1]).toBe(error);
        expect((consoleError.mock.calls[0]?.[1] as Error).cause).toBe(cause);
    });

    it.each([400, 404])("stays quiet for a %i, which is the caller's to fix", (statusCode) => {
        start()(httpError({ statusCode }), REQUEST);

        expect(consoleError).not.toHaveBeenCalled();
    });

    it.each([{ unhandled: true }, { fatal: true }])(
        "leaves %j to Nitro, so the error is not printed twice",
        (flags) => {
            start()(httpError({ statusCode: 500, ...flags }), REQUEST);

            expect(consoleError).not.toHaveBeenCalled();
        },
    );

    it("leaves a failed cache refresh to the cache, which already prints it", () => {
        start()(new Error("refresh failed"), { event: EVENT, tags: ["cache"] });

        expect(consoleError).not.toHaveBeenCalled();
    });
});
