import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const nitro = vi.hoisted(() => ({
    fetch: vi.fn(),
    newsletter: { baseURL: "https://mail.test", apiKey: "key-us1", audienceId: "aud1" },
}));

vi.stubGlobal("useRuntimeConfig", () => ({ newsletter: nitro.newsletter }));
vi.stubGlobal("$fetch", nitro.fetch);
vi.stubGlobal("createError", (input: Record<string, unknown>) =>
    Object.assign(new Error("http"), input),
);

const { addSubscriber } = await import("./mailchimp");

// The shape `$fetch` rejects with: Mailchimp's problem document arrives as `data`
const rejected = (title: string, detail: string) =>
    Object.assign(new Error("Bad Request"), {
        statusCode: 400,
        data: { status: 400, title, detail },
    });

const options = () => nitro.fetch.mock.calls[0]?.[1] as Record<string, unknown>;

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    vi.clearAllMocks();
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    nitro.newsletter = { baseURL: "https://mail.test", apiKey: "key-us1", audienceId: "aud1" };
    nitro.fetch.mockResolvedValue({});
});

describe("addSubscriber", () => {
    it("puts the member at the MD5 of the lowercased address, so a casing change is the same member", async () => {
        await addSubscriber({} as never, "Lucia@Ejemplo.es");

        const hash = createHash("md5").update("lucia@ejemplo.es").digest("hex");

        expect(nitro.fetch).toHaveBeenCalledWith(
            `/3.0/lists/aud1/members/${hash}`,
            expect.objectContaining({ baseURL: "https://mail.test", method: "PUT" }),
        );
    });

    it("never sends a status, so an address that unsubscribed is not resubscribed", async () => {
        await addSubscriber({} as never, "lucia@ejemplo.es");

        expect(options().body).toEqual({
            email_address: "lucia@ejemplo.es",
            status_if_new: "pending",
        });
        expect(options().body).not.toHaveProperty("status");
    });

    it("authenticates with the API key as the Basic password", async () => {
        await addSubscriber({} as never, "lucia@ejemplo.es");

        const [, credentials] = (
            options().headers as { Authorization: string }
        ).Authorization.split(" ");

        expect(atob(credentials ?? "").split(":")[1]).toBe("key-us1");
    });

    it.each([
        ["a 429", Object.assign(new Error("Too Many Requests"), { statusCode: 429 })],
        ["a 500", Object.assign(new Error("Internal Server Error"), { statusCode: 500 })],
        ["no answer at all", new Error("fetch failed")],
    ])("answers 502 on %s, keeping the cause", async (_, cause) => {
        nitro.fetch.mockRejectedValue(cause);

        await expect(addSubscriber({} as never, "lucia@ejemplo.es")).rejects.toMatchObject({
            statusCode: 502,
            cause,
        });
    });

    it("answers any 400 as a 422 on the email field, so nothing hangs on Mailchimp's wording", async () => {
        nitro.fetch.mockRejectedValue(rejected("A Title Mailchimp Renamed", "Anything at all."));

        await expect(addSubscriber({} as never, "lucia@ejemplo.es")).rejects.toMatchObject({
            statusCode: 422,
            data: [{ name: "email", message: "rejected" }],
        });
    });

    it("logs a refusal's title but never the address its detail names", async () => {
        nitro.fetch.mockRejectedValue(
            rejected("Member In Compliance State", "lucia@ejemplo.es cannot be subscribed."),
        );

        await addSubscriber({} as never, "lucia@ejemplo.es").catch(() => {});

        expect(warn).toHaveBeenCalledWith(expect.stringContaining("Member In Compliance State"));
        expect(warn).not.toHaveBeenCalledWith(expect.stringContaining("lucia"));
    });
});
