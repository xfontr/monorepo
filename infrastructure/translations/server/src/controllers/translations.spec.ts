import { beforeEach, describe, expect, it, vi } from "vitest";

// mocked: a malformed locale file cannot be committed to projects/, the JSON lint rejects it
const readLocale = vi.hoisted(() => vi.fn());

vi.mock("../utils/readLocale.ts", () => ({ default: readLocale }));

const { app } = await import("../app.ts");

const get = (path: string) => app.request(path);

function fsError(code: string) {
    return Object.assign(new Error(code), { code });
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("GET /:locale/:project failures", () => {
    it("404s a locale file that is not there", async () => {
        readLocale.mockRejectedValue(fsError("ENOENT"));

        expect((await get("/zz/external")).status).toBe(404);
    });

    it("500s a malformed locale file, rather than reporting it as a missing locale", async () => {
        readLocale.mockRejectedValue(new SyntaxError("Unexpected token }"));

        const res = await get("/en-GB/external");

        expect(res.status).toBe(500);
        await expect(res.json()).resolves.toEqual({ error: "Locale \"en-GB\" in \"external\" could not be read" });
    });

    it("500s a locale file it cannot read, so a permissions fault is not mistaken for a typo", async () => {
        readLocale.mockRejectedValue(fsError("EACCES"));

        expect((await get("/en-GB/external")).status).toBe(500);
    });
});
