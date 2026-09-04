#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import type { CoverageMapData } from "istanbul-lib-coverage";
import { createContext } from "istanbul-lib-report";
import reports from "istanbul-reports";
import { run } from "../shared/exec.ts";
import { toReports } from "./discover.ts";
import { mergeReports } from "./merge.ts";
import { projectsWithCoverage } from "./nx.ts";

// This package's own scripts run with cwd set to infrastructure/scripts (`pnpm --filter` changes
// into it first), so every path below is resolved against the repo root explicitly.
const REPO_ROOT = run("git", ["rev-parse", "--show-toplevel"]);
const OUTPUT_DIR = join(REPO_ROOT, "coverage");

const loadReport = (relativePath: string): CoverageMapData | undefined => {
    const path = join(REPO_ROOT, relativePath);
    if (!existsSync(path)) return undefined;
    return JSON.parse(readFileSync(path, "utf8")) as CoverageMapData;
};

const projects = toReports(projectsWithCoverage());
const loaded = projects.map(({ name, coverageFinal }) => ({ name, data: loadReport(coverageFinal) }));

const coverageMap = mergeReports(loaded);

mkdirSync(OUTPUT_DIR, { recursive: true });
const context = createContext({ dir: OUTPUT_DIR, coverageMap });
reports.create("html").execute(context);

process.stdout.write(`Wrote ${join(OUTPUT_DIR, "index.html")}, merged from ${loaded.length} projects.\n`);
