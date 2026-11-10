import { beforeEach, describe, expect, it, vi } from "vitest";

const h3 = vi.hoisted(() => ({
    createError: vi.fn((input: object) => Object.assign(new Error("h3"), input)),
    defineEventHandler: vi.fn((handler: unknown) => handler),
    readBody: vi.fn(),
}));
const workflows = vi.hoisted(() => ({ applyEdit: vi.fn() }));

vi.mock("h3", () => h3);
vi.mock("../../utils/workflows.ts", () => workflows);

const route = (await import("./edit.post.ts")).default as (event: unknown) => Promise<unknown>;

beforeEach(() => {
    vi.clearAllMocks();
});

describe("workflow edit route", () => {
    // Vitest runs without `nuxt dev`, which is exactly the deployed site's position.
    it("answers 404 outside nuxt dev rather than writing a file", async () => {
        await expect(route({})).rejects.toMatchObject({ statusCode: 404 });
        expect(workflows.applyEdit).not.toHaveBeenCalled();
    });
});
