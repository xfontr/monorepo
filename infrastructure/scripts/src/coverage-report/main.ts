import { join } from "node:path";
import { at } from "../shared/adapters/git.ts";
import { out } from "../shared/adapters/io.ts";
import { loadReport, writeHtmlReport } from "./adapters/files.ts";
import { projectsWithCoverage } from "./adapters/nx.ts";
import { toReports } from "./domain/discover.ts";
import { mergeReports } from "./domain/merge.ts";

export const main = async (): Promise<void> => {
    const projects = toReports(await projectsWithCoverage());
    const loaded = projects.map(({ name, coverageFinal }) => ({ name, data: loadReport(coverageFinal) }));

    const coverageMap = mergeReports(loaded);
    const outputDir = at("coverage");

    writeHtmlReport(outputDir, coverageMap);

    out.success(`Wrote ${join(outputDir, "index.html")}, merged from ${loaded.length} projects.`);
};
