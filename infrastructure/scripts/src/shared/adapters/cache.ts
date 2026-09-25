import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { flag } from "../cli.ts";

const CACHE_DIR = "node_modules/.cache/@monorepo/scripts";
// TTL is one day; `--refresh` remains the explicit invalidation.
const TTL_MS = 24 * 60 * 60 * 1000;

const pathFor = (key: string): string => `${CACHE_DIR}/${key}.json`;

// Read per call so importing a module cannot freeze the flag's value.
const refreshRequested = (): boolean => flag("refresh");

const isEmptyList = (data: unknown): boolean => Array.isArray(data) && data.length === 0;

/** Cache stable project and label lists for 24h; issue lists stay live because triage changes them. */
export const cached = <T>(key: string, fetch: () => T): T => {
    const file = pathFor(key);

    if (!refreshRequested()) {
        try {
            const { fetchedAt, data } = JSON.parse(readFileSync(file, "utf8")) as { fetchedAt: number, data: T };
            if (!isEmptyList(data) && Date.now() - fetchedAt < TTL_MS) return data;
        }
        catch {
            // Cache misses and corrupt data fall through to a live fetch.
        }
    }

    const data = fetch();
    // An empty list here is usually a swallowed failure, and writing it would erase the offline fallback.
    if (!isEmptyList(data)) writeCache(key, data);
    return data;
};

/** Offline mode reads stale cache without the TTL gate because no fetch can replace it. */
export const readCache = <T>(key: string): T | undefined => {
    try {
        return (JSON.parse(readFileSync(pathFor(key), "utf8")) as { data: T }).data;
    }
    catch {
        // Offline cache misses return no issues.
        return undefined;
    }
};

/** Issue lists refresh the cache on every run instead of using `cached`'s TTL gate. */
export const writeCache = <T>(key: string, data: T): void => {
    try {
        mkdirSync(dirname(pathFor(key)), { recursive: true });
        writeFileSync(pathFor(key), JSON.stringify({ fetchedAt: Date.now(), data }));
    }
    catch {
        // Cache writes fail open so a successful command is not lost to storage errors.
    }
};
