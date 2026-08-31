import { describe, expect, it, vi } from "vitest";
import { FetchError, type $Fetch } from "ofetch";
import { OfetchHttpClient } from "./OfetchHttpClient";
import { UpstreamError } from "#core/domain/errors";

function failingFetch(cause: unknown): $Fetch {
    return vi.fn().mockRejectedValue(cause) as unknown as $Fetch;
}

function fetchError(status: number): FetchError {
    return Object.assign(new FetchError("upstream said no"), {
        response: { status } as unknown as FetchError["response"],
    });
}

describe("OfetchHttpClient", () => {
    it("passes the url through untouched so the ofetch baseURL applies", async () => {
        const $fetch = vi.fn().mockResolvedValue({ shared: {} }) as unknown as $Fetch;

        await expect(new OfetchHttpClient($fetch).get("en-GB/external")).resolves.toEqual({ shared: {} });
        expect($fetch).toHaveBeenCalledWith("en-GB/external", { headers: undefined });
    });

    it("forwards headers, so vendors that need auth can be reached", async () => {
        const $fetch = vi.fn().mockResolvedValue({ shared: {} }) as unknown as $Fetch;

        await new OfetchHttpClient($fetch).get("en-GB/external", { headers: { "X-API-Key": "abc" } });

        expect($fetch).toHaveBeenCalledWith("en-GB/external", { headers: { "X-API-Key": "abc" } });
    });

    describe("when the request fails", () => {
        // Without this the domain cannot tell "upstream said no" from "the network is down", and a
        // FetchError reaches the client carrying the vendor's URL in its message
        it("never surfaces a transport-specific error", async () => {
            const $fetch = failingFetch(fetchError(401));

            await expect(new OfetchHttpClient($fetch).get("en-GB/external")).rejects.not.toBeInstanceOf(FetchError);
            await expect(new OfetchHttpClient($fetch).get("en-GB/external")).rejects.toBeInstanceOf(UpstreamError);
        });

        // The locale is checked against the declared list before the request, so nothing upstream can
        // report is the caller's fault — the status is diagnosis, not a status to serve
        it.each([400, 401, 404, 500])("reports upstream %i as a gateway failure, keeping the status", async (status) => {
            const $fetch = failingFetch(fetchError(status));

            await expect(new OfetchHttpClient($fetch).get("en-GB/external")).rejects.toMatchObject({
                upstreamStatus: status,
                statusCode: 502,
            });
        });

        // A network error carries no status, which is why it is optional rather than defaulted to
        // something that looks like an answer from upstream
        it("reports a failure that never reached the vendor without a status", async () => {
            const cause = new Error("connect ECONNREFUSED");
            const $fetch = failingFetch(cause);

            await expect(new OfetchHttpClient($fetch).get("en-GB/external")).rejects.toMatchObject({
                upstreamStatus: undefined,
                statusCode: 502,
                cause,
            });
        });
    });
});
