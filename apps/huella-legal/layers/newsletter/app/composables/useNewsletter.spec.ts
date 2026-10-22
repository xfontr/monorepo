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

// The shape `$fetch` rejects with: the route's `createError` arrives as the body, under `data`
const rejected = (statusCode: number, data?: unknown) =>
    Object.assign(new Error("fetch failed"), {
        statusCode,
        data: { error: true, statusCode, statusMessage: "Invalid subscription", data },
    });

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

        await newsletter.subscribe(FIELDS, challenge);

        expect(fetch).toHaveBeenCalledWith("/api/newsletter", {
            method: "POST",
            body: { ...FIELDS, token: "tok" },
        });
        expect(newsletter.status.value).toBe("success");
    });

    it("is submitting while the request is in flight, and ignores a second submit", async () => {
        const newsletter = await setUp();
        let settle: () => void = () => undefined;

        fetch.mockReturnValue(new Promise<void>((resolve) => (settle = resolve)));

        const first = newsletter.subscribe(FIELDS, challenge);

        await vi.waitFor(() => expect(newsletter.status.value).toBe("submitting"));
        await newsletter.subscribe(FIELDS, challenge);
        settle();
        await first;

        expect(fetch).toHaveBeenCalledOnce();
        expect(newsletter.status.value).toBe("success");
    });

    it("turns a 422 into invalid, keeping the server's issue codes for the form to word", async () => {
        const newsletter = await setUp();

        fetch.mockRejectedValue(rejected(422, [{ name: "email", message: "invalid" }]));

        await newsletter.subscribe(FIELDS, challenge);

        expect(newsletter.status.value).toBe("invalid");
        expect(newsletter.errors.value).toEqual([{ name: "email", message: "invalid" }]);
    });

    it.each([
        ["a failed challenge", 403],
        ["a vendor failure", 502],
        ["a misconfigured server", 500],
    ])("turns %s into error, with no field blamed", async (_, statusCode) => {
        const newsletter = await setUp();

        fetch.mockRejectedValue(rejected(statusCode));

        await newsletter.subscribe(FIELDS, challenge);

        expect(newsletter.status.value).toBe("error");
        expect(newsletter.errors.value).toEqual([]);
    });

    it("turns a challenge that never yields a token into error without posting", async () => {
        const newsletter = await setUp();

        await newsletter.subscribe(FIELDS, () => Promise.reject(new Error("Timeout")));

        expect(fetch).not.toHaveBeenCalled();
        expect(newsletter.status.value).toBe("error");
    });

    it("clears the last attempt's errors on a retry", async () => {
        const newsletter = await setUp();

        fetch.mockRejectedValueOnce(rejected(422, [{ name: "email", message: "invalid" }]));
        await newsletter.subscribe(FIELDS, challenge);
        await newsletter.subscribe(FIELDS, challenge);

        expect(newsletter.status.value).toBe("success");
        expect(newsletter.errors.value).toEqual([]);
    });
});
