import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { useNewsletter } from "./useNewsletter";

const FIELDS = { email: "lucia@ejemplo.es", website: "" };

const fetch = vi.hoisted(() => vi.fn());

// The i18n loader fetches the locale through the same import, so only the route is faked
mockNuxtImport(
    "$fetch",
    () => (url: string, options: unknown) =>
        url === "/api/newsletter" ? fetch(url, options) : globalThis.$fetch(url, options as never),
);

// A challenge with a token at hand: the waiting and the reset are FormChallenge's own spec
const challenge = vi.fn((send: (token: string) => Promise<unknown>) => send("tok")) as Challenge;

const setUp = async () => {
    let controller: ReturnType<typeof useNewsletter> | undefined;

    await mountSuspended(
        defineComponent({
            setup: () => {
                controller = useNewsletter();

                return () => null;
            },
        }),
    );

    return controller!;
};

beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockResolvedValue(undefined);
});

describe("useNewsletter", () => {
    it("posts the address and the honeypot with the challenge's token, then reports success", async () => {
        const newsletter = await setUp();

        await newsletter.send(FIELDS, challenge);

        expect(fetch).toHaveBeenCalledWith("/api/newsletter", {
            method: "POST",
            body: { ...FIELDS, token: "tok" },
        });
        expect(newsletter.status.value).toBe("success");
    });
});
