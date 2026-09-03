import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import process from "node:process";

const CACHE_DIR = "node_modules/.cache/@monorepo/scripts";
// A day, not a session: labels and projects change on the order of quarters, so this is a
// backstop, not the mechanism. `--refresh` is the mechanism.
const TTL_MS = 24 * 60 * 60 * 1000;

const pathFor = (key: string): string => `${CACHE_DIR}/${key}.json`;

// Read once per process rather than per call, so nothing downstream has to thread the flag through.
const refreshRequested = process.argv.includes("--refresh");

/**
 * Wraps a `gh` call that barely ever changes (projects, labels) in a 24h file cache, keyed by
 * name. Deliberately not used for `listIssues`: that one changes on every triage, and a stale
 * answer there is worse than the round trip it would save.
 */
export const cached = <T>(key: string, fetch: () => T): T => {
    const file = pathFor(key);

    if (!refreshRequested) {
        try {
            const { fetchedAt, data } = JSON.parse(readFileSync(file, "utf8")) as { fetchedAt: number, data: T };
            if (Date.now() - fetchedAt < TTL_MS) return data;
        }
        catch {
            // No cache yet, or it's corrupt — fall through to a real fetch.
        }
    }

    const data = fetch();

    try {
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, JSON.stringify({ fetchedAt: Date.now(), data }));
    }
    catch {
        // A cache write failing (read-only fs, no space) shouldn't fail a command that has its answer.
    }

    return data;
};
