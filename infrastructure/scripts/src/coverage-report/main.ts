import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { createContext } from "istanbul-lib-report";
import reports from "istanbul-reports";
import { at } from "../shared/git.ts";
import { out } from "../shared/io.ts";
import { toReports } from "./discover.ts";
import { loadReport } from "./files.ts";
import { mergeReports } from "./merge.ts";
import { projectsWithCoverage } from "./nx.ts";

export const main = (): void => {
    const projects = toReports(projectsWithCoverage());
    const loaded = projects.map(({ name, coverageFinal }) => ({ name, data: loadReport(coverageFinal) }));

    const coverageMap = mergeReports(loaded);
    const outputDir = at("coverage");

    mkdirSync(outputDir, { recursive: true });
    reports.create("html").execute(createContext({ dir: outputDir, coverageMap }));

    out.success(`Wrote ${join(outputDir, "index.html")}, merged from ${loaded.length} projects.`);
};
