import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { createContext } from "istanbul-lib-report";
import reports from "istanbul-reports";
import { at } from "../shared/adapters/git.ts";
import { out } from "../shared/adapters/io.ts";
import { loadReport } from "./adapters/files.ts";
import { projectsWithCoverage } from "./adapters/nx.ts";
import { toReports } from "./domain/discover.ts";
import { mergeReports } from "./domain/merge.ts";

export const main = (): void => {
    const projects = toReports(projectsWithCoverage());
    const loaded = projects.map(({ name, coverageFinal }) => ({ name, data: loadReport(coverageFinal) }));

    const coverageMap = mergeReports(loaded);
    const outputDir = at("coverage");

    mkdirSync(outputDir, { recursive: true });
    reports.create("html").execute(createContext({ dir: outputDir, coverageMap }));

    out.success(`Wrote ${join(outputDir, "index.html")}, merged from ${loaded.length} projects.`);
};
