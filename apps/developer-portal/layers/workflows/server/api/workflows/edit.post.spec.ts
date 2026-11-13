import { beforeEach, describe, expect, it, vi } from "vitest";

const h3 = vi.hoisted(() => ({
    createError: vi.fn((input: object) => Object.assign(new Error("h3"), input)),
    defineEventHandler: vi.fn((handler: unknown) => handler),
    readBody: vi.fn(),
    getRequestHeader: vi.fn(),
}));
const workflows = vi.hoisted(() => ({ applyEdit: vi.fn() }));

vi.mock("h3", () => h3);
vi.mock("../../utils/workflows.ts", () => workflows);

const route = (await import("./edit.post.ts")).default as (event: unknown) => Promise<unknown>;

const headers = vi.hoisted(() => ({ value: {} as Record<string, string> }));

beforeEach(() => {
    vi.clearAllMocks();
    headers.value = { "content-type": "application/json", "sec-fetch-site": "same-origin" };
    h3.getRequestHeader.mockImplementation((_event: unknown, name: string) => headers.value[name]);
});

describe("workflow edit route", () => {
    // Vitest runs without `nuxt dev`, which is exactly the deployed site's position.
    it("answers 404 outside nuxt dev rather than writing a file", async () => {
        await expect(route({})).rejects.toMatchObject({ statusCode: 404 });
        expect(workflows.applyEdit).not.toHaveBeenCalled();
    });

    it.each([
        [
            "a form post from another site",
            { "content-type": "application/x-www-form-urlencoded", "sec-fetch-site": "cross-site" },
            403,
        ],
        [
            "a form post with no fetch metadata",
            { "content-type": "application/x-www-form-urlencoded" },
            415,
        ],
        [
            "JSON sent from another site",
            { "content-type": "application/json", "sec-fetch-site": "same-site" },
            403,
        ],
    ])("refuses %s before reading the body", async (_case, sent, statusCode) => {
        headers.value = sent;

        await expect(route({})).rejects.toMatchObject({ statusCode });
        expect(h3.readBody).not.toHaveBeenCalled();
    });
});
