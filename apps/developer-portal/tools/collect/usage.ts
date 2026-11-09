import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseDisables, summarizeLint } from "../../shared/lintUsage.ts";
import type { UsageArtifact } from "../../shared/types.ts";
import { parseLog, summarize, windowStart } from "../../shared/usage.ts";
import { enabledRules } from "../lib/lintRules.ts";
import { WORKSPACE_ROOT } from "../lib/paths.ts";
import { git } from "../lib/run.ts";

/** One CSV per branch and log, written by `pnpm usage:flush` from the pre-commit hook. */
const LOG_ROOT = resolve(WORKSPACE_ROOT, ".telemetry");
const SCRIPTS_DIR = resolve(WORKSPACE_ROOT, "infrastructure/scripts/src");

/** `shared/` is what every script uses, and `usage/` is the flush, which never records itself. */
const NOT_RECORDED = new Set(["shared", "usage"]);

/** No log folder yet is the state of a repo nobody has committed a row in, so it reads as none. */
const readLog = async (log: string): Promise<string[]> => {
    const dir = resolve(LOG_ROOT, log);
    const files = await readdir(dir).catch(() => []);

    return Promise.all(
        files
            .filter((file) => file.endsWith(".csv"))
            .map((file) => readFile(resolve(dir, file), "utf8")),
    );
};

const knownScripts = async (): Promise<string[]> =>
    (await readdir(SCRIPTS_DIR, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory() && !NOT_RECORDED.has(entry.name))
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));

const countDisables = async (files: string[]): Promise<Record<string, number>> => {
    const sources = await Promise.all(
        files.map((file) => readFile(resolve(WORKSPACE_ROOT, file), "utf8")),
    );
    const counts: Record<string, number> = {};

    for (const rule of sources.flatMap(parseDisables)) counts[rule] = (counts[rule] ?? 0) + 1;

    return counts;
};

export const collectUsage = async (generatedAt: string): Promise<UsageArtifact> => {
    const tracked = (await git(["ls-files", "--", "*.ts", "*.vue"])).split("\n").filter(Boolean);
    const [known, scriptLogs, lintLogs, enabled, disabled] = await Promise.all([
        knownScripts(),
        readLog("scripts"),
        readLog("lint"),
        enabledRules(tracked),
        countDisables(tracked),
    ]);

    return {
        ...summarize(scriptLogs.flatMap(parseLog), known, generatedAt),
        lint: summarizeLint(
            lintLogs.flatMap(parseLog),
            enabled,
            disabled,
            windowStart(generatedAt),
        ),
    };
};
