import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { useContact } from "./useContact";

const FIELDS = {
    name: "Lucía Pérez",
    email: "lucia@ejemplo.es",
    message: "Una pregunta sobre un artículo.",
    consent: true,
    website: "",
};

const fetch = vi.hoisted(() => vi.fn());

// The i18n loader fetches the locale through the same import, so only the route is faked
mockNuxtImport(
    "$fetch",
    () => (url: string, options: unknown) =>
        url === "/api/contact" ? fetch(url, options) : globalThis.$fetch(url, options as never),
);

// A challenge with a token at hand: the waiting and the reset are FormChallenge's own spec
const challenge = vi.fn((send: (token: string) => Promise<unknown>) => send("tok")) as Challenge;

// The shape `$fetch` rejects with: the route's `createError` arrives as the body, under `data`
const rejected = (statusCode: number, data?: unknown) =>
    Object.assign(new Error("fetch failed"), {
        statusCode,
        data: { error: true, statusCode, statusMessage: "Invalid message", data },
    });

const setUp = async () => {
    let controller: ReturnType<typeof useContact> | undefined;

    await mountSuspended(
        defineComponent({
            setup: () => {
                controller = useContact();

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

describe("useContact", () => {
    it("posts the fields and the honeypot with the challenge's token, then reports success", async () => {
        const contact = await setUp();

        await contact.send(FIELDS, challenge);

        expect(fetch).toHaveBeenCalledWith("/api/contact", {
            method: "POST",
            body: { ...FIELDS, token: "tok" },
        });
        expect(contact.status.value).toBe("success");
    });

    it("is submitting while the request is in flight, and ignores a second submit", async () => {
        const contact = await setUp();
        let settle: () => void = () => undefined;

        fetch.mockReturnValue(new Promise<void>((resolve) => (settle = resolve)));

        const first = contact.send(FIELDS, challenge);

        await vi.waitFor(() => expect(contact.status.value).toBe("submitting"));
        await contact.send(FIELDS, challenge);
        settle();
        await first;

        expect(fetch).toHaveBeenCalledOnce();
        expect(contact.status.value).toBe("success");
    });

    it("turns a 422 into invalid, keeping the server's issue codes for the form to word", async () => {
        const contact = await setUp();
        const issues = [
            { name: "email", message: "invalid" },
            { name: "message", message: "required" },
        ];

        fetch.mockRejectedValue(rejected(422, issues));

        await contact.send(FIELDS, challenge);

        expect(contact.status.value).toBe("invalid");
        expect(contact.errors.value).toEqual(issues);
    });

    it.each([
        ["a failed challenge", 403],
        ["a vendor failure", 502],
        ["a misconfigured server", 500],
    ])("turns %s into error, with no field blamed", async (_, statusCode) => {
        const contact = await setUp();

        fetch.mockRejectedValue(rejected(statusCode));

        await contact.send(FIELDS, challenge);

        expect(contact.status.value).toBe("error");
        expect(contact.errors.value).toEqual([]);
    });

    it("turns a challenge that never yields a token into error without posting", async () => {
        const contact = await setUp();

        await contact.send(FIELDS, () => Promise.reject(new Error("Timeout")));

        expect(fetch).not.toHaveBeenCalled();
        expect(contact.status.value).toBe("error");
    });

    it("clears the last attempt's errors on a retry", async () => {
        const contact = await setUp();

        fetch.mockRejectedValueOnce(rejected(422, [{ name: "email", message: "invalid" }]));
        await contact.send(FIELDS, challenge);
        await contact.send(FIELDS, challenge);

        expect(contact.status.value).toBe("success");
        expect(contact.errors.value).toEqual([]);
    });
});
