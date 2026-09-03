import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fs = vi.hoisted(() => ({
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
}));

vi.mock("node:fs", () => fs);

const ORIGINAL_ARGV = process.argv;
const DAY_MS = 24 * 60 * 60 * 1000;

// `cache.ts` reads `--refresh` off argv once, at module load, so a test that flips it has to
// reset the module registry too — otherwise it's asserting against the first import's flag.
const importCached = async () => (await import("./cache.ts")).cached;

beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
});

afterEach(() => {
    process.argv = ORIGINAL_ARGV;
});

describe("cached", () => {
    it("returns the cached value without calling fetch while the entry is under 24h old", async () => {
        fs.readFileSync.mockReturnValue(JSON.stringify({ fetchedAt: Date.now(), data: "cached" }));
        const cached = await importCached();
        const fetch = vi.fn(() => "fresh");

        expect(cached("projects", fetch)).toBe("cached");
        expect(fetch).not.toHaveBeenCalled();
    });

    it("re-fetches and overwrites the file once the entry is older than 24h", async () => {
        fs.readFileSync.mockReturnValue(JSON.stringify({ fetchedAt: Date.now() - DAY_MS - 1, data: "stale" }));
        const cached = await importCached();
        const fetch = vi.fn(() => "fresh");

        expect(cached("projects", fetch)).toBe("fresh");
        expect(fs.writeFileSync).toHaveBeenCalledOnce();
    });

    it("fetches instead of throwing when there's no cache file yet", async () => {
        fs.readFileSync.mockImplementation(() => {
            throw new Error("ENOENT");
        });
        const cached = await importCached();

        expect(cached("projects", () => "fresh")).toBe("fresh");
    });

    // The escape hatch: a fresh cache is still a wrong answer once you know it needs busting.
    it("bypasses a cache that's still fresh when --refresh is on the command line", async () => {
        process.argv = [...ORIGINAL_ARGV, "--refresh"];
        fs.readFileSync.mockReturnValue(JSON.stringify({ fetchedAt: Date.now(), data: "cached" }));
        const cached = await importCached();
        const fetch = vi.fn(() => "fresh");

        expect(cached("projects", fetch)).toBe("fresh");
        expect(fetch).toHaveBeenCalledOnce();
    });

    it("still returns the fetched value when the cache write fails, so a read-only fs can't fail the command", async () => {
        fs.readFileSync.mockImplementation(() => {
            throw new Error("ENOENT");
        });
        fs.writeFileSync.mockImplementation(() => {
            throw new Error("EROFS");
        });
        const cached = await importCached();

        expect(cached("projects", () => "fresh")).toBe("fresh");
    });
});
