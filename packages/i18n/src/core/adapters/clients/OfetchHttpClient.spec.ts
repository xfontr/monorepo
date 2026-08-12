import { describe, expect, it, vi } from "vitest";
import type { $Fetch } from "ofetch";
import { OfetchHttpClient } from "./OfetchHttpClient";

describe("OfetchHttpClient", () => {
    it("passes the url through untouched so the ofetch baseURL applies", async () => {
        const $fetch = vi.fn().mockResolvedValue({ shared: {} }) as unknown as $Fetch;

        await expect(new OfetchHttpClient($fetch).get("en-EN/external")).resolves.toEqual({ shared: {} });
        expect($fetch).toHaveBeenCalledWith("en-EN/external");
    });

    it("rejects when the request fails", async () => {
        const cause = new Error("network down");
        const $fetch = vi.fn().mockRejectedValue(cause) as unknown as $Fetch;

        await expect(new OfetchHttpClient($fetch).get("en-EN/external")).rejects.toBe(cause);
    });
});
