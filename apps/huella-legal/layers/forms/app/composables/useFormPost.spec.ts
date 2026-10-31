import type { FormError } from "@nuxt/ui";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { useFormPost } from "./useFormPost";

type Failure = "duplicate" | "unavailable";

interface Request extends FormRequest {
    email: string;
}

const ENDPOINT = "/api/form";

const FIELDS = { email: "lucia@ejemplo.es", website: "" };

const FAILURES = { 409: "duplicate" } as const satisfies Partial<Record<number, Failure>>;

const fetch = vi.hoisted(() => vi.fn());

// The i18n loader fetches the locale through the same import, so only the route is faked
mockNuxtImport(
    "$fetch",
    () => (url: string, options: unknown) =>
        url === ENDPOINT ? fetch(url, options) : globalThis.$fetch(url, options as never),
);

// A challenge with a token at hand: the waiting and the reset are FormChallenge's own spec
const challenge = vi.fn((send: (token: string) => Promise<unknown>) => send("tok")) as Challenge;

// The shape `$fetch` rejects with: the route's `createError` arrives as the body, under `data`
const rejected = (statusCode: number, data?: unknown) =>
    Object.assign(new Error("fetch failed"), {
        statusCode,
        data: { error: true, statusCode, statusMessage: "Refused", data },
    });

const setUp = async () => {
    let controller: ReturnType<typeof useFormPost<Request, FormError, Failure>> | undefined;

    await mountSuspended(
        defineComponent({
            setup: () => {
                controller = useFormPost<Request, FormError, Failure>(ENDPOINT, {
                    failures: FAILURES,
                });

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

describe("useFormPost", () => {
    it("posts the fields and the honeypot with the challenge's token, then reports success", async () => {
        const post = await setUp();

        await post.send(FIELDS, challenge);

        expect(fetch).toHaveBeenCalledWith(ENDPOINT, {
            method: "POST",
            body: { ...FIELDS, token: "tok" },
        });
        expect(post.status.value).toBe("success");
    });

    it("is submitting while the request is in flight, and ignores a second submit", async () => {
        const post = await setUp();
        let settle: () => void = () => undefined;

        fetch.mockReturnValue(new Promise<void>((resolve) => (settle = resolve)));

        const first = post.send(FIELDS, challenge);

        await vi.waitFor(() => expect(post.status.value).toBe("submitting"));
        await post.send(FIELDS, challenge);
        settle();
        await first;

        expect(fetch).toHaveBeenCalledOnce();
        expect(post.status.value).toBe("success");
    });

    it("turns a 422 into invalid, keeping the server's issue codes with no failure to announce", async () => {
        const post = await setUp();
        const issues = [{ name: "email", message: "invalid" }];

        fetch.mockRejectedValue(rejected(422, issues));
        await post.send(FIELDS, challenge);

        expect(post.status.value).toBe("invalid");
        expect(post.errors.value).toEqual(issues);
        expect(post.failure.value).toBeUndefined();
    });

    it.each([
        [409, "duplicate"],
        [403, "unavailable"],
        [502, "unavailable"],
        [422, "unavailable"],
    ] as const)("turns a %s with no field blamed into error: %s", async (statusCode, failure) => {
        const post = await setUp();

        fetch.mockRejectedValue(rejected(statusCode));
        await post.send(FIELDS, challenge);

        expect(post.status.value).toBe("error");
        expect(post.errors.value).toEqual([]);
        expect(post.failure.value).toBe(failure);
    });

    it("turns a challenge that never yields a token into error without posting", async () => {
        const post = await setUp();

        await post.send(FIELDS, () => Promise.reject(new Error("Timeout")));

        expect(fetch).not.toHaveBeenCalled();
        expect(post.status.value).toBe("error");
    });

    it("clears the last attempt's errors and failure on a retry", async () => {
        const post = await setUp();

        fetch.mockRejectedValueOnce(rejected(422, [{ name: "email", message: "invalid" }]));
        await post.send(FIELDS, challenge);
        fetch.mockRejectedValueOnce(rejected(409));
        await post.send(FIELDS, challenge);
        await post.send(FIELDS, challenge);

        expect(post.status.value).toBe("success");
        expect(post.errors.value).toEqual([]);
        expect(post.failure.value).toBeUndefined();
    });
});
