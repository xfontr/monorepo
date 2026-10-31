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
});
