import { existsSync, readFileSync } from "node:fs";
import type { CoverageMapData } from "istanbul-lib-coverage";
import { at } from "../../shared/adapters/git.ts";

/** Returns `undefined` instead of throwing — merge.ts collects every missing report into one error. */
export const loadReport = (relativePath: string): CoverageMapData | undefined => {
    const path = at(relativePath);
    if (!existsSync(path)) return undefined;

    return JSON.parse(readFileSync(path, "utf8")) as CoverageMapData;
};
