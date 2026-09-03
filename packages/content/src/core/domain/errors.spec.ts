import { describe, expect, it } from "vitest";
import {
    ContentError,
    ContentUnavailableError,
    MalformedQueryError,
    MisconfiguredVendorError,
    NotFoundError,
    UndefinedResourceError,
    UndefinedVendorError,
    UpstreamError,
} from "./errors";

describe("UpstreamError", () => {
    // The caller's request is what these two diagnose, so relaying them says something true
    it.each([400, 404])("passes a %i through as the answer to the request that caused it", (status) => {
        const error = new UpstreamError(status);

        expect(error.statusCode).toBe(status);
        expect(error.upstreamStatus).toBe(status);
    });

    // Our own credentials are what an upstream 401 rejects — inviting the client to retry with different
    // ones would be a lie, and a 429 aimed at our IP is not the client's quota either
    it.each([401, 403, 429, 500, 502, 503])("reports a %i as a gateway failure of ours", (status) => {
        expect(new UpstreamError(status).statusCode).toBe(502);
    });

    it("reports a request that never got a status as a gateway failure", () => {
        const error = new UpstreamError(undefined);

        expect(error.statusCode).toBe(502);
        expect(error.upstreamStatus).toBeUndefined();
        expect(error.statusMessage).toBe("Upstream request failed");
    });

    // statusMessage reaches the client, and the vendor endpoint is not the client's business
    it("never repeats the transport's message, which carries the vendor URL", () => {
        const cause = new Error("connect ECONNREFUSED https://wp.internal/wp-json/wp/v2/posts");

        expect(new UpstreamError(500, cause).statusMessage).toBe("Upstream request failed");
    });

    it("keeps the transport failure as the cause", () => {
        const cause = new Error("network down");

        expect(new UpstreamError(undefined, cause).cause).toBe(cause);
    });
});

describe("content errors", () => {
    it("reports an unreachable vendor as a bad gateway, naming the resource that could not be served", () => {
        const error = new ContentUnavailableError("posts");

        expect(error.statusCode).toBe(502);
        expect(error.statusMessage).toContain("posts");
    });

    it("keeps the original failure as the cause", () => {
        const cause = new Error("upstream down");

        expect(new ContentUnavailableError("posts", cause).cause).toBe(cause);
    });

    it("reports an unregistered vendor as an internal error, naming the ones that exist", () => {
        const error = new UndefinedVendorError("nope", ["wordpress", "test"]);

        expect(error.statusCode).toBe(500);
        expect(error.statusMessage).toContain("nope");
        expect(error.statusMessage).toContain("wordpress, test");
    });

    it("survives a missing vendor name without throwing", () => {
        expect(new UndefinedVendorError(undefined, ["wordpress"]).statusCode).toBe(500);
    });

    // One restart per missing variable is the thing worth avoiding
    it("reports unusable vendor config as an internal error, listing every problem at once", () => {
        const error = new MisconfiguredVendorError("WordpressProvider", ["baseURL is not an absolute URL", "token is empty"]);

        expect(error.statusCode).toBe(500);
        expect(error.statusMessage).toBe("WordpressProvider is misconfigured: baseURL is not an absolute URL, token is empty");
        expect(error.problems).toHaveLength(2);
    });

    it("reports an unknown resource as not found, naming the ones that exist", () => {
        const error = new UndefinedResourceError("media", ["posts", "pages"]);

        expect(error.statusCode).toBe(404);
        expect(error.statusMessage).toContain("media");
        expect(error.statusMessage).toContain("posts, pages");
    });

    it("survives a missing resource without throwing", () => {
        expect(new UndefinedResourceError(undefined, ["posts"]).statusCode).toBe(404);
    });

    it("reports a malformed query parameter as the caller's fault, saying what was expected", () => {
        const error = new MalformedQueryError("page", "an integer between 1 and 1000");

        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toContain("page");
        expect(error.statusMessage).toContain("an integer between 1 and 1000");
    });

    it("reports a slug that matches nothing as not found", () => {
        const error = new NotFoundError("posts", "hello-world");

        expect(error.statusCode).toBe(404);
        expect(error.statusMessage).toContain("posts");
        expect(error.statusMessage).toContain("hello-world");
    });
});

// One instanceof at the edge has to catch anything the package raises, or a status is invented twice
describe("every error", () => {
    it.each([
        new UpstreamError(404),
        new ContentUnavailableError("posts"),
        new UndefinedVendorError("nope", ["wordpress"]),
        new MisconfiguredVendorError("WordpressProvider", ["baseURL is not an absolute URL"]),
        new UndefinedResourceError("media", ["posts"]),
        new MalformedQueryError("page", "an integer"),
        new NotFoundError("posts", "hello-world"),
    ])("is throwable through h3 as $statusCode", (error) => {
        expect(error).toBeInstanceOf(ContentError);
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe(error.statusMessage);
        expect(error.name).toBe(error.constructor.name);
    });
});
