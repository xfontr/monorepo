import { isAbsolute } from "node:path";
import type { CoverageMap, CoverageMapData } from "istanbul-lib-coverage";
import libCoverage from "istanbul-lib-coverage";
import { ExpectedError } from "../../shared/errors.ts";

export type LoadedReport = {
    name: string
    data: CoverageMapData | undefined // undefined when coverage-final.json wasn't found on disk
};

export const assertComplete = (reports: LoadedReport[]): void => {
    const missing = reports.filter((report) => report.data === undefined).map((report) => report.name);
    if (missing.length > 0) {
        throw new ExpectedError(
            `No coverage-final.json for: ${missing.join(", ")}. Run \`nx run-many -t test:coverage\` first, not \`affected\`.`,
        );
    }
};

export const assertAbsolutePaths = (name: string, data: CoverageMapData): void => {
    const relativePaths = Object.keys(data).filter((path) => !isAbsolute(path));
    if (relativePaths.length > 0) {
        throw new ExpectedError(
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
