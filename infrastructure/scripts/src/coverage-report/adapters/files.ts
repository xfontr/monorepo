import { existsSync, mkdirSync, readFileSync } from "node:fs";
import type { CoverageMap, CoverageMapData } from "istanbul-lib-coverage";
import { createContext } from "istanbul-lib-report";
import reports from "istanbul-reports";
import { at } from "../../shared/adapters/git.ts";

/** Returns `undefined` instead of throwing — merge.ts collects every missing report into one error. */
export const loadReport = (relativePath: string): CoverageMapData | undefined => {
    const path = at(relativePath);
    if (!existsSync(path)) return undefined;

    return JSON.parse(readFileSync(path, "utf8")) as CoverageMapData;
};

export const writeHtmlReport = (dir: string, coverageMap: CoverageMap): void => {
    mkdirSync(dir, { recursive: true });
    reports.create("html").execute(createContext({ dir, coverageMap }));
};
