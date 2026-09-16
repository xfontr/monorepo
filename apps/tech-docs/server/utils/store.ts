import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

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

/**
 * The directory comes from `runtimeConfig`, resolved in `nuxt.config.ts` while the config still
 * knows where the project is. Deriving it from `import.meta.url` here instead put it at
 * `.output/server/.report` once Nitro bundled this module, which every artifact then read as null —
 * including during prerender, so a static build baked an empty dashboard and reported success.
 */
export function readArtifact<T>(name: string): Promise<T | null> {
    return readJson<T>(resolve(useRuntimeConfig().snapshotDir, `${name}.json`));
}
