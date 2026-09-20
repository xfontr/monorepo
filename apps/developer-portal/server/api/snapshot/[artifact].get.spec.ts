import { beforeEach, describe, expect, it, vi } from "vitest";

const h3 = vi.hoisted(() => ({
    defineEventHandler: vi.fn((handler: unknown) => handler),
    getRouterParam: vi.fn(),
}));
const store = vi.hoisted(() => ({ readArtifact: vi.fn() }));

vi.mock("h3", () => h3);
vi.mock("../../utils/store.ts", () => store);

import type { SnapshotResponse } from "./[artifact].get.ts";

const route = (await import("./[artifact].get.ts")).default as (event: unknown) => Promise<SnapshotResponse>;

beforeEach(() => {
    vi.clearAllMocks();
    h3.getRouterParam.mockReturnValue("docs");
    store.readArtifact.mockImplementation(async (name: string) => ({ name }));
});

describe("snapshot artifact route", () => {
    it.each(["projects", "coverage", "metrics", "deps", "docs", "scorecards"])(
        "reads the manifest and only the requested %s artifact under its matching response key",
        async (artifact) => {
            h3.getRouterParam.mockReturnValue(artifact);

            await expect(route({})).resolves.toEqual({ manifest: { name: "manifest" }, [artifact]: { name: artifact } });
            expect(store.readArtifact).toHaveBeenNthCalledWith(1, "manifest");
            expect(store.readArtifact).toHaveBeenNthCalledWith(2, artifact);
            expect(store.readArtifact).toHaveBeenCalledTimes(2);
        },
    );

    it("returns only the manifest for an unknown or missing artifact", async () => {
        h3.getRouterParam.mockReturnValueOnce("unknown");
        await expect(route({})).resolves.toEqual({ manifest: { name: "manifest" } });
        expect(store.readArtifact).toHaveBeenCalledTimes(1);

        vi.clearAllMocks();
        h3.getRouterParam.mockReturnValueOnce(undefined);
        store.readArtifact.mockResolvedValue({ name: "manifest" });
        await expect(route({})).resolves.toEqual({ manifest: { name: "manifest" } });
        expect(store.readArtifact).toHaveBeenCalledTimes(1);
    });

    it("keeps a null artifact value under its requested key instead of dropping the response field", async () => {
        store.readArtifact.mockImplementation(async (name: string) => name === "manifest" ? { name } : null);

        await expect(route({})).resolves.toEqual({ manifest: { name: "manifest" }, docs: null });
    });
});
