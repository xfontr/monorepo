import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cached, readCache, writeCache } from "./cache.ts";

const fs = vi.hoisted(() => ({
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
}));

vi.mock("node:fs", () => fs);

const ORIGINAL_ARGV = process.argv;
const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    process.argv = ORIGINAL_ARGV;
});

describe("cached", () => {
    it("returns the cached value without calling fetch while the entry is under 24h old", () => {
        fs.readFileSync.mockReturnValue(JSON.stringify({ fetchedAt: Date.now(), data: "cached" }));
        const fetch = vi.fn(() => "fresh");

        expect(cached("projects", fetch)).toBe("cached");
        expect(fetch).not.toHaveBeenCalled();
    });

    it("re-fetches and overwrites the file once the entry is older than 24h", () => {
        fs.readFileSync.mockReturnValue(JSON.stringify({ fetchedAt: Date.now() - DAY_MS - 1, data: "stale" }));
        const fetch = vi.fn(() => "fresh");

        expect(cached("projects", fetch)).toBe("fresh");
        expect(fs.writeFileSync).toHaveBeenCalledOnce();
    });

    it("fetches instead of throwing when there's no cache file yet", () => {
        fs.readFileSync.mockImplementation(() => {
            throw new Error("ENOENT");
        });

        expect(cached("projects", () => "fresh")).toBe("fresh");
    });

    // The escape hatch: a fresh cache is still a wrong answer once you know it needs busting. The
    // flag is read per call, so setting it here is enough — no module reset.
    it("bypasses a cache that's still fresh when --refresh is on the command line", () => {
        process.argv = [...ORIGINAL_ARGV, "--refresh"];
        fs.readFileSync.mockReturnValue(JSON.stringify({ fetchedAt: Date.now(), data: "cached" }));
        const fetch = vi.fn(() => "fresh");

        expect(cached("projects", fetch)).toBe("fresh");
        expect(fetch).toHaveBeenCalledOnce();
    });

    it("still returns the fetched value when the cache write fails, so a read-only fs can't fail the command", () => {
        fs.readFileSync.mockImplementation(() => {
            throw new Error("ENOENT");
        });
        fs.writeFileSync.mockImplementation(() => {
            throw new Error("EROFS");
        });

        expect(cached("projects", () => "fresh")).toBe("fresh");
    });
});

describe("readCache", () => {
    it("returns the stored data regardless of how old the entry is", () => {
        fs.readFileSync.mockReturnValue(JSON.stringify({ fetchedAt: Date.now() - DAY_MS * 30, data: "stale" }));

        expect(readCache("issues-foo")).toBe("stale");
    });

    it("returns undefined instead of throwing when there's no cache file yet", () => {
        fs.readFileSync.mockImplementation(() => {
            throw new Error("ENOENT");
        });

        expect(readCache("issues-foo")).toBeUndefined();
    });
});

describe("writeCache", () => {
    it("writes the data under the given key", () => {
        writeCache("issues-foo", ["one"]);

        expect(fs.writeFileSync).toHaveBeenCalledOnce();
        const [path, contents] = fs.writeFileSync.mock.calls[0] as [string, string];
        expect(path).toContain("issues-foo.json");
        expect(JSON.parse(contents)).toMatchObject({ data: ["one"] });
    });

    it("swallows a write failure instead of throwing, same as `cached`'s write", () => {
        fs.writeFileSync.mockImplementation(() => {
            throw new Error("EROFS");
        });

        expect(() => writeCache("issues-foo", ["one"])).not.toThrow();
    });
});
