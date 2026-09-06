import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { SNAPSHOT_DIR } from "../../tools/lib/paths.ts";

/**
 * A missing or half-written artifact resolves to null rather than throwing: `.report/` is
 * gitignored, so "never collected" is the state of a fresh clone and every page renders it.
 */
async function readJson<T>(path: string): Promise<T | null> {
    try {
        return JSON.parse(await readFile(path, "utf8")) as T;
    }
    catch {
        return null;
    }
}

export function readArtifact<T>(name: string): Promise<T | null> {
    return readJson<T>(resolve(SNAPSHOT_DIR, `${name}.json`));
}
