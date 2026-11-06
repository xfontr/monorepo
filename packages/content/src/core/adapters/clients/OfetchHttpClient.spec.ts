import { describe, expect, it, vi } from "vitest";
import { FetchError, type $Fetch } from "ofetch";
import { OfetchHttpClient } from "./OfetchHttpClient";
import { UpstreamError } from "#core/domain/errors";

const createFetch = (response: unknown) => {
    const raw = vi.fn().mockResolvedValue(response);

    return { raw, $fetch: { raw } as unknown as $Fetch };
};

const createFailingFetch = (cause: unknown) => {
    const raw = vi.fn().mockRejectedValue(cause);

    return { raw, $fetch: { raw } as unknown as $Fetch };
};

const fetchError = (status: number): FetchError =>
    Object.assign(new FetchError("upstream said no"), {
        response: { status } as unknown as FetchError["response"],
    });

describe("OfetchHttpClient", () => {
    // Vendors report pagination in headers, and a body alone cannot build a Page
    it("returns the parsed body together with the response headers", async () => {
        const headers = new Headers({ "x-wp-total": "12" });
        const { $fetch } = createFetch({ _data: [{ id: 1 }], headers });

        await expect(
            new OfetchHttpClient($fetch).get("https://wp.test/wp-json/wp/v2/posts"),
        ).resolves.toEqual({
            data: [{ id: 1 }],
            headers,
        });
    });

    // A provider owns how its vendor is addressed, so the transport must not rewrite the URL
    it("passes an absolute url through untouched", async () => {
        const { raw, $fetch } = createFetch({ _data: [], headers: new Headers() });

        await new OfetchHttpClient($fetch).get("https://wp.test/blog/wp-json/wp/v2/posts");

        expect(raw).toHaveBeenCalledWith("https://wp.test/blog/wp-json/wp/v2/posts", {
            headers: undefined,
            query: undefined,
        });
    });

    it("forwards headers and query, so a vendor that needs auth or paging can be reached", async () => {
        const { raw, $fetch } = createFetch({ _data: [], headers: new Headers() });

        await new OfetchHttpClient($fetch).get("https://wp.test/wp-json/wp/v2/posts", {
            headers: { "X-API-Key": "abc" },
            query: { per_page: 10, search: undefined },
        });

        expect(raw).toHaveBeenCalledWith("https://wp.test/wp-json/wp/v2/posts", {
            headers: { "X-API-Key": "abc" },
            query: { per_page: 10, search: undefined },
        });
    });

    // A host's bot filter can answer a REST route with a 200 challenge page, which ofetch hands back
    // as a string the provider would then try to map
    describe("when the vendor answers with something other than JSON", () => {
        const challenge = {
            _data: "<!DOCTYPE html>\n<html>\n  <title>Just a moment</title>\n</html>",
            headers: new Headers({ "content-type": "text/html; charset=UTF-8" }),
            status: 200,
        };

        it("fails the read instead of passing the page off as a parsed body", async () => {
            const { $fetch } = createFetch(challenge);

            await expect(
                new OfetchHttpClient($fetch).get("https://wp.test/wp-json/wp/v2/posts"),
            ).rejects.toMatchObject({ upstreamStatus: 200, statusCode: 502 });
        });

        it("names the url, type, status and start of the body on the cause, where logs reach it", async () => {
            const { $fetch } = createFetch(challenge);

            await expect(
                new OfetchHttpClient($fetch).get("https://wp.test/wp-json/wp/v2/posts"),
            ).rejects.toMatchObject({
                cause: {
                    message:
                        "Expected JSON from https://wp.test/wp-json/wp/v2/posts, got " +
                        `text/html; charset=UTF-8 (200): ${challenge._data}`,
                },
            });
        });

        it("keeps the vendor's url and body out of the message a client receives", async () => {
            const { $fetch } = createFetch(challenge);

            await expect(
                new OfetchHttpClient($fetch).get("https://wp.test/wp-json/wp/v2/posts"),
            ).rejects.toMatchObject({ statusMessage: "Upstream request failed" });
        });

        it("keeps only the start of the body, so a full page never floods the log", async () => {
            const { $fetch } = createFetch({ ...challenge, _data: "x".repeat(5000) });

            const error = await new OfetchHttpClient($fetch)
                .get("https://wp.test/wp-json/wp/v2/posts")
                .catch((caught: UpstreamError) => caught);

            expect((error as UpstreamError).cause).toHaveProperty(
                "message",
                expect.stringMatching(/: x{300}$/),
            );
        });

        // ofetch parses a body with no content type as JSON, so refusing it would break a vendor
        // that simply omits the header
        it.each([["application/json; charset=UTF-8"], ["application/problem+json"], [null]])(
            "accepts a %s body as JSON",
            async (contentType) => {
                const headers = new Headers(contentType ? { "content-type": contentType } : {});
                const { $fetch } = createFetch({ _data: [{ id: 1 }], headers, status: 200 });

                await expect(
                    new OfetchHttpClient($fetch).get("https://wp.test/wp-json/wp/v2/posts"),
                ).resolves.toMatchObject({ data: [{ id: 1 }] });
            },
        );
    });

    describe("when the request fails", () => {
        // Without this the domain cannot tell "upstream said no" from "the network is down"
        it("never surfaces a transport-specific error", async () => {
            const { $fetch } = createFailingFetch(fetchError(404));

            await expect(
                new OfetchHttpClient($fetch).get("https://wp.test/wp-json"),
            ).rejects.not.toBeInstanceOf(FetchError);
            await expect(
                new OfetchHttpClient($fetch).get("https://wp.test/wp-json"),
            ).rejects.toBeInstanceOf(UpstreamError);
        });

        it("hands the upstream status to the domain, which is the only part it can act on", async () => {
            const { $fetch } = createFailingFetch(fetchError(404));

            await expect(
                new OfetchHttpClient($fetch).get("https://wp.test/wp-json"),
            ).rejects.toMatchObject({
                upstreamStatus: 404,
                statusCode: 404,
            });
        });

        // A network error carries no status, which is why it is optional rather than defaulted to
        // something that looks like an answer from upstream
        it("reports a failure that never reached the vendor without a status", async () => {
            const cause = new Error("connect ECONNREFUSED");
            const { $fetch } = createFailingFetch(cause);

            await expect(
                new OfetchHttpClient($fetch).get("https://wp.test/wp-json"),
            ).rejects.toMatchObject({
                upstreamStatus: undefined,
                statusCode: 502,
                cause,
            });
        });
    });
});
