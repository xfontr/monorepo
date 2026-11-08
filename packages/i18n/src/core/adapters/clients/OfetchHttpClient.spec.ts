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
    it("returns the parsed body together with the response headers", async () => {
        const headers = new Headers({ "content-type": "application/json" });
        const { $fetch } = createFetch({ _data: { shared: {} }, headers });

        await expect(new OfetchHttpClient($fetch).get("en-GB/external")).resolves.toEqual({
            data: { shared: {} },
            headers,
        });
    });

    it("passes the url through untouched so the ofetch baseURL applies", async () => {
        const { raw, $fetch } = createFetch({ _data: {}, headers: new Headers() });

        await new OfetchHttpClient($fetch).get("en-GB/external");

        expect(raw).toHaveBeenCalledWith("en-GB/external", {
            headers: undefined,
            query: undefined,
        });
    });

    it("forwards headers and query, so a vendor that needs auth or parameters can be reached", async () => {
        const { raw, $fetch } = createFetch({ _data: {}, headers: new Headers() });

        await new OfetchHttpClient($fetch).get("en-GB/external", {
            headers: { "X-API-Key": "abc" },
            query: { format: "json", branch: undefined },
        });

        expect(raw).toHaveBeenCalledWith("en-GB/external", {
            headers: { "X-API-Key": "abc" },
            query: { format: "json", branch: undefined },
        });
    });

    // A proxy or bot filter can answer with a 200 HTML page, which ofetch hands back as a string the
    // provider would then serve as a TranslationMap
    describe("when the vendor answers with something other than JSON", () => {
        const page = {
            _data: "<!DOCTYPE html>\n<html>\n  <title>Just a moment</title>\n</html>",
            headers: new Headers({ "content-type": "text/html; charset=UTF-8" }),
            status: 200,
        };

        it("fails the read instead of passing the page off as a parsed body", async () => {
            const { $fetch } = createFetch(page);

            await expect(new OfetchHttpClient($fetch).get("en-GB/external")).rejects.toMatchObject({
                upstreamStatus: 200,
                statusCode: 502,
                statusMessage: "Upstream request failed",
            });
        });

        it("names the url, type, status and start of the body on the cause, where logs reach it", async () => {
            const { $fetch } = createFetch(page);

            await expect(new OfetchHttpClient($fetch).get("en-GB/external")).rejects.toMatchObject({
                cause: {
                    message:
                        "Expected JSON from en-GB/external, got " +
                        `text/html; charset=UTF-8 (200): ${page._data}`,
                },
            });
        });
    });

    describe("when the request fails", () => {
        // Without this the domain cannot tell "upstream said no" from "the network is down", and a
        // FetchError reaches the client carrying the vendor's URL in its message
        it("never surfaces a transport-specific error", async () => {
            const { $fetch } = createFailingFetch(fetchError(401));

            await expect(
                new OfetchHttpClient($fetch).get("en-GB/external"),
            ).rejects.not.toBeInstanceOf(FetchError);
            await expect(new OfetchHttpClient($fetch).get("en-GB/external")).rejects.toBeInstanceOf(
                UpstreamError,
            );
        });

        // The locale is checked against the declared list before the request, so nothing upstream can
        // report is the caller's fault — the status is diagnosis, not a status to serve
        it.each([400, 401, 404, 500])(
            "reports upstream %i as a gateway failure, keeping the status",
            async (status) => {
                const { $fetch } = createFailingFetch(fetchError(status));

                await expect(
                    new OfetchHttpClient($fetch).get("en-GB/external"),
                ).rejects.toMatchObject({
                    upstreamStatus: status,
                    statusCode: 502,
                });
            },
        );

        // A network error carries no status, which is why it is optional rather than defaulted to
        // something that looks like an answer from upstream
        it("reports a failure that never reached the vendor without a status", async () => {
            const cause = new Error("connect ECONNREFUSED");
            const { $fetch } = createFailingFetch(cause);

            await expect(new OfetchHttpClient($fetch).get("en-GB/external")).rejects.toMatchObject({
                upstreamStatus: undefined,
                statusCode: 502,
                cause,
            });
        });
    });
});
