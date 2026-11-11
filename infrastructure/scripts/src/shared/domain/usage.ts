import { basename, dirname } from "node:path";

/** The CSV header, in order. The developer portal reads columns by these names, not by position. */
export const COLUMNS = [
    "at",
    "script",
    "command",
    "target",
    "flags",
    "area",
    "caller",
    "tty",
    "exit",
    "ms",
] as const;

export type UsageRow = Record<(typeof COLUMNS)[number], string>;

/** `.claude/hooks/eslint-fix.sh` writes these in this order, so a change here changes it too. */
export const LINT_COLUMNS = ["at", "rule", "project", "severity", "fixable", "caller"] as const;

/** Each log is buffered in `.git/telemetry/<name>.csv` and flushed to `data/telemetry/<name>/`. */
export const LOGS: readonly { name: string; columns: readonly string[] }[] = [
    { name: "scripts", columns: COLUMNS },
    { name: "lint", columns: LINT_COLUMNS },
];

/** The only flags whose value is kept, because each takes one of a fixed set of words. */
export const VALUE_FLAGS: ReadonlySet<string> = new Set(["type", "project"]);

/** Set by `.husky/*`, so the checks a hook runs on every commit don't read as anyone's choice. */
export const HOOK_ENV = "MONOREPO_GIT_HOOK";

export const UNSCOPED_AREA = "repo";

const BRANCH_AREA = /^(?:feature|fix|hotfix|release)\/([^/]+)\//;

/** Cells never need quoting because nothing that could break a row survives into one. */
const cell = (value: string): string => value.replace(/[,"\r\n]/g, " ");

const label = (value: string): string => cell(value).replaceAll(";", " ");

export const toLine = (row: UsageRow): string =>
    COLUMNS.map((column) => cell(row[column])).join(",");

/** A line cut short by a killed process has fewer cells than the header, and is dropped. */
export const isCompleteLine = (line: string, columns: readonly string[] = COLUMNS): boolean =>
    line !== columns.join(",") && line.split(",").length === columns.length;

/** Claude Code sets `AI_AGENT` to e.g. `claude-code_2-1-319_agent`, and `CLAUDECODE=1` beside it. */
export const callerOf = (env: Record<string, string | undefined>): string => {
    if (env.AI_AGENT) return env.AI_AGENT.split("_")[0] || "agent";
    if (env.CLAUDECODE === "1") return "claude-code";
    return "human";
};

/** The flush is skipped too: it would record itself into the buffer it just emptied. */
export const isRecorded = (env: Record<string, string | undefined>, script: string): boolean =>
    !env.CI && !env.VITEST && !env[HOOK_ENV] && script !== "usage";

export const scriptOf = (entry: string): string => basename(dirname(entry));

export const areaOf = (branch: string): string => BRANCH_AREA.exec(branch)?.[1] ?? UNSCOPED_AREA;

/** The first positional naming a workspace project, e.g. `pnpm dev huella-legal`. */
export const targetOf = (positionals: string[], projects: ReadonlySet<string>): string =>
    positionals.find((positional) => projects.has(positional)) ?? "";

export const flagLabels = (flags: ReadonlySet<string>): string =>
    [...flags]
        .map((flag) => {
            const [name = "", ...value] = flag.split("=");
            return value.length > 0 && VALUE_FLAGS.has(name) ? `${name}=${value.join("=")}` : name;
        })
        .sort((a, b) => a.localeCompare(b))
        .map(label)
        .join(";");

/** One file per branch, so two branches never append to the same file and never conflict. */
export const logFileFor = (branch: string): string =>
    `${branch.replaceAll("/", "--").replace(/[^\w.-]/g, "_")}.csv`;
