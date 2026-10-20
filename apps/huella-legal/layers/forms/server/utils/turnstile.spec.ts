import { beforeEach, describe, expect, it, vi } from "vitest";

const nitro = vi.hoisted(() => ({ verify: vi.fn() }));

vi.stubGlobal("verifyTurnstileToken", nitro.verify);
vi.stubGlobal("createError", (input: Record<string, unknown>) =>
    Object.assign(new Error("http"), input),
);

const { assertChallenge } = await import("./turnstile");

// The shape `$fetch` rejects with: siteverify's JSON body arrives as `data`
const rejected = (statusCode: number, data: unknown) =>
    Object.assign(new Error("fetch failed"), { statusCode, data });

const refused = (code: string) => ({ success: false, "error-codes": [code] });

beforeEach(() => {
    vi.clearAllMocks();
    nitro.verify.mockResolvedValue({ success: true, "error-codes": [] });
});

describe("assertChallenge", () => {
    it("verifies the token against the request it came with", async () => {
        const event = {} as never;

        await expect(assertChallenge(event, "tok")).resolves.toBeUndefined();

        expect(nitro.verify).toHaveBeenCalledWith("tok", event);
    });

    it("leaves a missing token for Cloudflare to refuse, rather than sending `undefined`", async () => {
        nitro.verify.mockResolvedValue(refused("missing-input-response"));

        await expect(assertChallenge({} as never, undefined)).rejects.toMatchObject({
            statusCode: 403,
        });
        expect(nitro.verify).toHaveBeenCalledWith("", {});
    });

    it.each(["invalid-input-response", "invalid-input-secret", "internal-error", "a-new-code"])(
        "refuses %s with a 403 carrying Cloudflare's answer, never parsing the code",
        async (code) => {
            nitro.verify.mockResolvedValue(refused(code));

            await expect(assertChallenge({} as never, "tok")).rejects.toMatchObject({
                statusCode: 403,
                cause: refused(code),
            });
        },
    );

    it("refuses a token rejected with a 400 as a 403, not an outage", async () => {
        nitro.verify.mockRejectedValue(rejected(400, refused("invalid-input-secret")));

        await expect(assertChallenge({} as never, "tok")).rejects.toMatchObject({
            statusCode: 403,
            cause: refused("invalid-input-secret"),
        });
    });

    it.each([
        ["a network failure", new Error("ECONNRESET")],
        ["a 5xx page that is not siteverify's JSON", rejected(503, "<html>Service Unavailable")],
    ])("answers %s with a 502, keeping the cause", async (_, cause) => {
        nitro.verify.mockRejectedValue(cause);

        await expect(assertChallenge({} as never, "tok")).rejects.toMatchObject({
            statusCode: 502,
            cause,
        });
    });
});
