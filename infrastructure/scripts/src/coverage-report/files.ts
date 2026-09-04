import { existsSync, readFileSync } from "node:fs";
import type { CoverageMapData } from "istanbul-lib-coverage";
import { at } from "../shared/git.ts";

/**
 * `undefined` rather than a throw for a report that isn't there: *which* projects are missing one
 * is the useful error, and only [`merge.ts`](./merge.ts) sees all of them at once to say so in a
 * single message.
 */
export const loadReport = (relativePath: string): CoverageMapData | undefined => {
    const path = at(relativePath);
    if (!existsSync(path)) return undefined;

    return JSON.parse(readFileSync(path, "utf8")) as CoverageMapData;
};
