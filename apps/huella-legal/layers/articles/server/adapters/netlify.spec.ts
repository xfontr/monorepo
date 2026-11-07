import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const blobs = vi.hoisted(() => ({ getDeployStore: vi.fn(), get: vi.fn(), setJSON: vi.fn() }));

vi.mock("@netlify/blobs", () => ({ getDeployStore: blobs.getDeployStore }));

const { readSaved, save } = await import("./netlify");

const NOW = new Date("2026-11-07T12:00:00Z");

const offNetlify = () =>
    Object.assign(new Error("no Blobs context"), { name: "MissingBlobsEnvironmentError" });

beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ now: NOW });
    blobs.getDeployStore.mockReturnValue({ get: blobs.get, setJSON: blobs.setJSON });
});

afterEach(() => {
    vi.useRealTimers();
});

describe("readSaved", () => {
    it("returns what this deploy saved inside the window, from the named store", async () => {
        blobs.get.mockResolvedValue({ savedAt: NOW.getTime() - 59_000, value: ["a"] });

        await expect(readSaved("article-index", "posts", 60)).resolves.toEqual(["a"]);
        expect(blobs.getDeployStore).toHaveBeenCalledWith("article-index");
        expect(blobs.get).toHaveBeenCalledWith("posts", { type: "json" });
    });

    it("ignores a copy older than the window, so new posts still reach the listings", async () => {
        blobs.get.mockResolvedValue({ savedAt: NOW.getTime() - 60_000, value: ["a"] });

        await expect(readSaved("article-index", "posts", 60)).resolves.toBeUndefined();
    });

    it("returns nothing when nothing was saved yet", async () => {
        blobs.get.mockResolvedValue(null);

        await expect(readSaved("article-index", "posts", 60)).resolves.toBeUndefined();
    });

    it("returns nothing off Netlify, where there is no store to read", async () => {
        blobs.getDeployStore.mockImplementation(() => {
            throw offNetlify();
        });

        await expect(readSaved("article-index", "posts", 60)).resolves.toBeUndefined();
    });

    it("rethrows any other store error, which is a bug rather than a missing environment", async () => {
        blobs.getDeployStore.mockImplementation(() => {
            throw new Error("bad store name");
        });

        await expect(readSaved("article-index", "posts", 60)).rejects.toThrow("bad store name");
    });

    it("falls back to nothing with a warning when the read fails, so the render still answers", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        blobs.get.mockRejectedValue(new Error("timeout"));

        await expect(readSaved("article-index", "posts", 60)).resolves.toBeUndefined();
        expect(warn).toHaveBeenCalledOnce();
    });
});

describe("save", () => {
    it("stores the value with the time it was saved, which readSaved ages it by", async () => {
        await save("article-index", "posts", ["a"]);

        expect(blobs.setJSON).toHaveBeenCalledWith("posts", {
            savedAt: NOW.getTime(),
            value: ["a"],
        });
    });

    it("does nothing off Netlify", async () => {
        blobs.getDeployStore.mockImplementation(() => {
            throw offNetlify();
        });

        await save("article-index", "posts", ["a"]);

        expect(blobs.setJSON).not.toHaveBeenCalled();
    });

    it("only warns when the write fails, since the reader's page doesn't depend on it", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        blobs.setJSON.mockRejectedValue(new Error("timeout"));

        await expect(save("article-index", "posts", ["a"])).resolves.toBeUndefined();
        expect(warn).toHaveBeenCalledOnce();
    });
});
