import { isAbsolute } from "node:path";
import type { CoverageMap, CoverageMapData } from "istanbul-lib-coverage";
import libCoverage from "istanbul-lib-coverage";

export interface LoadedReport {
    name: string;
    data: CoverageMapData | undefined; // undefined when coverage-final.json wasn't found on disk
}

/**
 * A merge built from whatever happened to be on disk is a report that's silently missing a
 * project — the same failure `affected` would produce. Naming every gap at once, rather than
 * stopping at the first, is what makes the fix ("run test:coverage for the whole workspace")
 * obvious from a single error instead of a retry loop.
 */
export const assertComplete = (reports: LoadedReport[]): void => {
    const missing = reports.filter((report) => report.data === undefined).map((report) => report.name);
    if (missing.length > 0) {
        throw new Error(
            `No coverage-final.json for: ${missing.join(", ")}. Run \`nx run-many -t test:coverage\` first, not \`affected\`.`,
        );
    }
};

/**
 * Keys in `coverage-final.json` are absolute paths, which is what lets every project's files land
 * in the merged map without colliding. A project that ever emitted relative paths would fold two
 * different `src/index.ts` files into one silently wrong entry instead — checked rather than
 * trusted, per the spike.
 */
export const assertAbsolutePaths = (name: string, data: CoverageMapData): void => {
    const relativePaths = Object.keys(data).filter((path) => !isAbsolute(path));
    if (relativePaths.length > 0) {
        throw new Error(
            `${name}'s coverage-final.json has relative paths, which would collide once merged: ${relativePaths.join(", ")}`,
        );
    }
};

export const mergeReports = (reports: LoadedReport[]): CoverageMap => {
    assertComplete(reports);

    const map = libCoverage.createCoverageMap({});
    for (const { name, data } of reports) {
        assertAbsolutePaths(name, data as CoverageMapData);
        map.merge(data as CoverageMapData);
    }
    return map;
};
