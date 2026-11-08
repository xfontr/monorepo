import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { useReplyPace } from "./useReplyPace";

const fetch = vi.hoisted(() => ({ pace: undefined as ReplyPace | undefined, call: vi.fn() }));

mockNuxtImport("useFetch", () => (url: string, options: unknown) => {
    fetch.call(url, options);

    return { data: ref(fetch.pace) };
});

beforeEach(() => {
    vi.clearAllMocks();
    fetch.pace = undefined;
});

describe("useReplyPace", () => {
    it("reads the date in the browser, so a prerendered page never bakes it in", () => {
        useReplyPace();

        expect(fetch.call).toHaveBeenCalledWith(
            "/api/replies",
            expect.objectContaining({ server: false }),
        );
    });

    it("reports no slow date until the route has answered, rather than flashing a warning", () => {
        expect(useReplyPace().value).toBeUndefined();
    });

    it("hands on the last slow day the route names", () => {
        fetch.pace = { slowUntil: "2026-08-31" };

        expect(useReplyPace().value).toBe("2026-08-31");
    });
});
