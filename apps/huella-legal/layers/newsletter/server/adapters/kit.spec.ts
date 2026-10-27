import { beforeEach, describe, expect, it, vi } from "vitest";

const nitro = vi.hoisted(() => ({
    fetch: vi.fn(),
    newsletter: { baseURL: "https://mail.test", apiKey: "kit-key", formId: "form1" },
}));

vi.stubGlobal("useRuntimeConfig", () => ({ newsletter: nitro.newsletter }));
vi.stubGlobal("$fetch", nitro.fetch);
vi.stubGlobal("createError", (input: Record<string, unknown>) =>
    Object.assign(new Error("http"), input),
);

const { addSubscriber } = await import("./kit");

const created = (state: string) => ({ subscriber: { id: 42, state } });

// The shape `$fetch` rejects with: Kit's error list arrives as `data`
const refused = (message: string) =>
    Object.assign(new Error("Unprocessable Entity"), {
        statusCode: 422,
        data: { errors: [message] },
    });

const call = (index: number) =>
    nitro.fetch.mock.calls[index] as [string, Record<string, unknown>] | undefined;

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    vi.clearAllMocks();
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    nitro.newsletter = { baseURL: "https://mail.test", apiKey: "kit-key", formId: "form1" };
    nitro.fetch.mockResolvedValueOnce(created("inactive")).mockResolvedValueOnce({});
});

describe("addSubscriber", () => {
    it("creates the address unconfirmed, then adds that subscriber to the form that sends the confirmation", async () => {
        await addSubscriber({} as never, "lucia@ejemplo.es");

        expect(call(0)?.[0]).toBe("/v4/subscribers");
        expect(call(0)?.[1]).toMatchObject({
            baseURL: "https://mail.test",
            method: "POST",
            body: { email_address: "lucia@ejemplo.es", state: "inactive" },
        });
        expect(call(1)?.[0]).toBe("/v4/forms/form1/subscribers/42");
        expect(call(1)?.[1]).toMatchObject({ baseURL: "https://mail.test", method: "POST" });
    });

    it("authenticates both calls with the API key header", async () => {
        await addSubscriber({} as never, "lucia@ejemplo.es");

        for (const index of [0, 1])
            expect(call(index)?.[1]).toMatchObject({ headers: { "X-Kit-Api-Key": "kit-key" } });
    });

    it("still adds an active subscriber to the form, sending no state that could demote them", async () => {
        nitro.fetch.mockReset().mockResolvedValueOnce(created("active")).mockResolvedValueOnce({});

        await addSubscriber({} as never, "lucia@ejemplo.es");

        expect(nitro.fetch).toHaveBeenCalledTimes(2);
        expect(call(0)?.[1]).toMatchObject({ body: { state: "inactive" } });
    });

    it.each(["cancelled", "bounced", "complained"])(
        "never adds a %s subscriber to the form, so nobody who left is resubscribed",
        async (state) => {
            nitro.fetch.mockReset().mockResolvedValueOnce(created(state));

            await expect(addSubscriber({} as never, "lucia@ejemplo.es")).resolves.toBeUndefined();
            expect(nitro.fetch).toHaveBeenCalledTimes(1);
        },
    );

    it.each([
        ["creating the subscriber", [refused("Anything.")]],
        ["adding them to the form", [created("inactive"), refused("Anything.")]],
    ])("answers a 422 on %s as a 422 on the email field", async (_, answers) => {
        nitro.fetch.mockReset();
        for (const answer of answers)
            if (answer instanceof Error) nitro.fetch.mockRejectedValueOnce(answer);
            else nitro.fetch.mockResolvedValueOnce(answer);

        await expect(addSubscriber({} as never, "lucia@ejemplo.es")).rejects.toMatchObject({
            statusCode: 422,
            data: [{ name: "email", message: "rejected" }],
        });
    });

    it("logs a refusal without the address Kit's errors may name", async () => {
        nitro.fetch.mockReset().mockRejectedValueOnce(refused("lucia@ejemplo.es is invalid"));

        await addSubscriber({} as never, "lucia@ejemplo.es").catch(() => {});

        expect(warn).toHaveBeenCalledOnce();
        expect(warn).not.toHaveBeenCalledWith(expect.stringContaining("lucia"));
    });

    it.each([
        ["a 401", Object.assign(new Error("Unauthorized"), { statusCode: 401 })],
        ["a 404", Object.assign(new Error("Not Found"), { statusCode: 404 })],
        ["a 429", Object.assign(new Error("Too Many Requests"), { statusCode: 429 })],
        ["a 500", Object.assign(new Error("Internal Server Error"), { statusCode: 500 })],
        ["no answer at all", new Error("fetch failed")],
    ])("answers 502 on %s, keeping the cause", async (_, cause) => {
        nitro.fetch.mockReset().mockRejectedValueOnce(cause);

        await expect(addSubscriber({} as never, "lucia@ejemplo.es")).rejects.toMatchObject({
            statusCode: 502,
            cause,
        });
    });
});
