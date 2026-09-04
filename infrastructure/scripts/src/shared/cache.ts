import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { flag } from "./cli.ts";

const CACHE_DIR = "node_modules/.cache/@monorepo/scripts";
// A day, not a session: labels and projects change on the order of quarters, so this is a
// backstop, not the mechanism. `--refresh` is the mechanism.
const TTL_MS = 24 * 60 * 60 * 1000;

const pathFor = (key: string): string => `${CACHE_DIR}/${key}.json`;

// Read per call rather than at module load — nothing downstream has to thread the flag through,
// and importing this module no longer decides the answer before the command has even started.
const refreshRequested = (): boolean => flag("refresh");

/**
 * Wraps a `gh` call that barely ever changes (projects, labels) in a 24h file cache, keyed by
 * name. Deliberately not used for `listIssues`: that one changes on every triage, and a stale
 * answer there is worse than the round trip it would save.
 */
export const cached = <T>(key: string, fetch: () => T): T => {
    const file = pathFor(key);

    if (!refreshRequested()) {
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

/**
 * The read half of `cached`, minus the TTL gate: offline mode wants whatever's on disk, however
 * old, instead of `cached`'s fresh-or-nothing answer — there's no fetch to fall back to.
 */
export const readCache = <T>(key: string): T | undefined => {
    try {
        return (JSON.parse(readFileSync(pathFor(key), "utf8")) as { data: T }).data;
    }
    catch {
        return undefined;
    }
};

/**
 * The write half, exported on its own for callers that need to update the cache on every run
 * rather than only on a TTL miss — `listIssues` does, because a stale issue list is the one
 * answer this whole flow exists to avoid.
 */
export const writeCache = <T>(key: string, data: T): void => {
    try {
        mkdirSync(dirname(pathFor(key)), { recursive: true });
        writeFileSync(pathFor(key), JSON.stringify({ fetchedAt: Date.now(), data }));
    }
    catch {
        // Same fail-open stance as `cached`'s write.
    }
};
