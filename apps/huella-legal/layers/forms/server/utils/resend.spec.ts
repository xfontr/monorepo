import { beforeEach, describe, expect, it, vi } from "vitest";

const nitro = vi.hoisted(() => ({
    fetch: vi.fn(),
    mail: {
        baseURL: "https://mail.test",
        apiKey: "resend-key",
        from: "web@revista.test",
    },
}));

vi.stubGlobal("useRuntimeConfig", () => ({ mail: nitro.mail }));
vi.stubGlobal("$fetch", nitro.fetch);
vi.stubGlobal("createError", (input: Record<string, unknown>) =>
    Object.assign(new Error("http"), input),
);

const { sendMail } = await import("./resend");

const MAIL = {
    to: "redaccion@revista.test",
    replyTo: "lucia@ejemplo.es",
    subject: "Contacto: Lucía Pérez",
    text: "Una pregunta sobre el último número.",
};

const call = () => nitro.fetch.mock.calls[0] as [string, Record<string, unknown>] | undefined;

const body = () => call()?.[1].body as Record<string, unknown>;

beforeEach(() => {
    vi.clearAllMocks();
    nitro.fetch.mockResolvedValue({ id: "email1" });
});

describe("sendMail", () => {
    it("sends one email from the configured sender to the given inbox, authenticated with the API key", async () => {
        await sendMail({} as never, MAIL);

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
        await sendMail({} as never, MAIL);

        expect(body()).toMatchObject({ reply_to: "lucia@ejemplo.es" });
    });

    it("sends plain text with no HTML, and no attachments key when there is nothing to attach", async () => {
        await sendMail({} as never, { ...MAIL, attachments: [] });

        expect(body().text).toBe("Una pregunta sobre el último número.");
        expect(body()).not.toHaveProperty("html");
        expect(body()).not.toHaveProperty("attachments");
    });

    it("passes an attachment through as Resend's filename and base64 content", async () => {
        const attachments = [{ filename: "borrador.docx", content: "UEsDBA==" }];

        await sendMail({} as never, { ...MAIL, attachments });

        expect(body().attachments).toEqual(attachments);
    });

    it("folds a pasted line break in the subject, so it never splits the header", async () => {
        await sendMail({} as never, { ...MAIL, subject: "Contacto: Lucía\r\nBcc: x@spam.test" });

        expect(body().subject).toBe("Contacto: Lucía Bcc: x@spam.test");
    });

    it.each([
        ["a 403", Object.assign(new Error("Forbidden"), { statusCode: 403 })],
        ["a 422", Object.assign(new Error("Unprocessable Entity"), { statusCode: 422 })],
        ["a 429", Object.assign(new Error("Too Many Requests"), { statusCode: 429 })],
        ["no answer at all", new Error("fetch failed")],
    ])("answers 502 on %s, keeping the cause", async (_, cause) => {
        nitro.fetch.mockRejectedValue(cause);

        await expect(sendMail({} as never, MAIL)).rejects.toMatchObject({
            statusCode: 502,
            cause,
        });
    });
});
