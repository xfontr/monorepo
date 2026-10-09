import { describe, expect, it, vi } from "vitest";

vi.stubGlobal("createError", (input: Error) => Object.assign(new Error("http"), input, { cause: input }));

const { ArticlesError, ContentRouteError, MisconfiguredSiteError, rethrowAsHttpError } = await import("./errors");

describe("ContentRouteError", () => {
    // The content route already turned a vendor failure into the status it should answer with
    it.each([400, 404, 500, 502])("passes the route's %i through untouched", (status) => {
        expect(new ContentRouteError({ response: { status } }).statusCode).toBe(status);
    });

    it("answers a request that never got a response as a bad gateway, not a 500 of ours", () => {
        expect(new ContentRouteError(new TypeError("fetch failed")).statusCode).toBe(502);
    });

    // statusMessage reaches the client, and the route's own wording is the content module's business
    it("never repeats the route's message, keeping the failure as its cause instead", () => {
        const cause = Object.assign(new Error("[GET] \"/api/content/posts/x\": 404 No \"posts\" found"), { response: { status: 404 } });
        const error = new ContentRouteError(cause);

        expect(error.statusMessage).toBe("Content route failed");
        expect(error.cause).toBe(cause);
    });
});

describe("MisconfiguredSiteError", () => {
    it("500s naming everything that is unset at once", () => {
        const error = new MisconfiguredSiteError(["NUXT_PUBLIC_SITE_URL is not set", "NUXT_PUBLIC_SITE_NAME is not set"]);

        expect(error.statusCode).toBe(500);
        expect(error.statusMessage).toBe("Site is misconfigured: NUXT_PUBLIC_SITE_URL is not set, NUXT_PUBLIC_SITE_NAME is not set");
    });
});

describe("articles errors", () => {
    it("are all one ArticlesError, so one instanceof catches anything the layer raises", () => {
        expect(new ContentRouteError()).toBeInstanceOf(ArticlesError);
        expect(new MisconfiguredSiteError([])).toBeInstanceOf(ArticlesError);
    });

    it("carry their own class name, so a log line says which one it was", () => {
        expect(new ContentRouteError().name).toBe("ContentRouteError");
    });
});

describe("rethrowAsHttpError", () => {
    it("hands our own diagnosis to h3 with the status it settled on", () => {
        const cause = new ContentRouteError({ response: { status: 404 } });

        expect(() => rethrowAsHttpError(cause)).toThrow(expect.objectContaining({ statusCode: 404, cause }) as Error);
    });

    // Anything else keeps its stack and reports as unhandled, rather than being dressed up as ours
    it("lets a failure it cannot diagnose through untouched", () => {
        const cause = new Error("mapper is broken");

        expect(() => rethrowAsHttpError(cause)).toThrow(cause);
    });
});
