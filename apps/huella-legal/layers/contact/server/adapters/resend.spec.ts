import { beforeEach, describe, expect, it, vi } from "vitest";

const nitro = vi.hoisted(() => ({
    fetch: vi.fn(),
    mail: {
        baseURL: "https://mail.test",
        apiKey: "resend-key",
        from: "web@revista.test",
        to: "redaccion@revista.test",
    },
}));

vi.stubGlobal("useRuntimeConfig", () => ({ mail: nitro.mail }));
vi.stubGlobal("$fetch", nitro.fetch);
vi.stubGlobal("createError", (input: Record<string, unknown>) =>
    Object.assign(new Error("http"), input),
);

const { sendContactMessage } = await import("./resend");

const CONTACT = {
    name: "Lucía Pérez",
    email: "lucia@ejemplo.es",
    message: "Una pregunta sobre el último número.",
};

const call = () => nitro.fetch.mock.calls[0] as [string, Record<string, unknown>] | undefined;

beforeEach(() => {
    vi.clearAllMocks();
    nitro.fetch.mockResolvedValue({ id: "email1" });
});

describe("sendContactMessage", () => {
    it("sends one email from the configured sender to the inbox, authenticated with the API key", async () => {
        await sendContactMessage({} as never, CONTACT);

        expect(nitro.fetch).toHaveBeenCalledOnce();
        expect(call()?.[0]).toBe("/emails");
        expect(call()?.[1]).toMatchObject({
            baseURL: "https://mail.test",
            method: "POST",
            headers: { Authorization: "Bearer resend-key" },
            body: { from: "web@revista.test", to: "redaccion@revista.test" },
        });
    });

    it("sets Reply-To to the reader, so answering the email reaches them and not the sender", async () => {
        await sendContactMessage({} as never, CONTACT);

        expect(call()?.[1]).toMatchObject({ body: { reply_to: "lucia@ejemplo.es" } });
    });

    it("sends the message as plain text with no HTML and no attachment", async () => {
        await sendContactMessage({} as never, CONTACT);

        const body = call()?.[1].body as Record<string, unknown>;

        expect(body.text).toContain("Una pregunta sobre el último número.");
        expect(body.text).toContain("Lucía Pérez <lucia@ejemplo.es>");
        expect(body).not.toHaveProperty("html");
        expect(body).not.toHaveProperty("attachments");
    });

    it("folds a pasted line break in the name, so it never splits the subject header", async () => {
        await sendContactMessage({} as never, { ...CONTACT, name: "Lucía\r\nBcc: x@spam.test" });

        expect(call()?.[1]).toMatchObject({
            body: { subject: "Contacto: Lucía Bcc: x@spam.test" },
        });
    });

    it.each([
        ["a 403", Object.assign(new Error("Forbidden"), { statusCode: 403 })],
        ["a 422", Object.assign(new Error("Unprocessable Entity"), { statusCode: 422 })],
        ["a 429", Object.assign(new Error("Too Many Requests"), { statusCode: 429 })],
        ["no answer at all", new Error("fetch failed")],
    ])("answers 502 on %s, keeping the cause", async (_, cause) => {
        nitro.fetch.mockRejectedValue(cause);

        await expect(sendContactMessage({} as never, CONTACT)).rejects.toMatchObject({
            statusCode: 502,
            cause,
        });
    });
});
