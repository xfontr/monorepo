import { beforeEach, describe, expect, it, vi } from "vitest";
import { collectUsage } from "./usage.ts";

const state = vi.hoisted(() => ({
    readdir: vi.fn(),
    readFile: vi.fn(),
    git: vi.fn(),
    enabledRules: vi.fn(),
    files: {} as Record<string, string>,
}));

vi.mock("node:fs/promises", () => ({ readdir: state.readdir, readFile: state.readFile }));
vi.mock("../lib/run.ts", () => ({ git: state.git }));
vi.mock("../lib/lintRules.ts", () => ({ enabledRules: state.enabledRules }));

const NOW = "2026-11-09T00:00:00.000Z";
const SCRIPT_HEADER = "at,script,command,target,flags,area,caller,tty,exit,ms";
const LINT_HEADER = "at,rule,project,severity,fixable,caller";

const dir = (name: string, directory = true) => ({ name, isDirectory: () => directory });

/** Paths are keyed by their last two segments: `scripts/a.csv`, `src/cli.ts`. */
const tail = (path: string): string => path.split("/").slice(-2).join("/");

beforeEach(() => {
    vi.clearAllMocks();
    state.files = {};
    state.git.mockResolvedValue("");
    state.enabledRules.mockResolvedValue([]);
    state.readdir.mockImplementation(async (path: string) => {
        if (path.endsWith("scripts/src"))
            return [dir("map"), dir("drift"), dir("shared"), dir("usage"), dir("notes.md", false)];

        const inside = Object.keys(state.files)
            .filter((key) => key.startsWith(`${path.split("/").at(-1)}/`))
            .map((key) => key.split("/")[1]);
        if (inside.length === 0) throw new Error("ENOENT");
        return inside;
    });
    state.readFile.mockImplementation(async (path: string) => state.files[tail(path)] ?? "");
});

describe("collectUsage", () => {
    it("lists every script folder in name order, leaving out shared and the flush", async () => {
        expect((await collectUsage(NOW)).known).toEqual(["drift", "map"]);
    });

    it("reads a repo with no log folders as no runs and no hits instead of failing", async () => {
        const usage = await collectUsage(NOW);

        expect(usage.scripts).toEqual({});
        expect(usage.lint).toEqual({ since: null, rules: {} });
    });

    it("adds up the rows of every branch's file and ignores anything that isn't a csv", async () => {
        const line = "2026-11-09,map,,,check,repo,human,1,0,90";
        state.files = {
            "scripts/feature--a--1-x.csv": `${SCRIPT_HEADER}\n${line}\n`,
            "scripts/fix--b--2-y.csv": `${SCRIPT_HEADER}\n${line}\n${line}\n`,
            "scripts/README.md": "# not a log",
        };

        expect((await collectUsage(NOW)).scripts.map?.runs).toBe(3);
    });

    it("puts lint hits, enabled rules and inline disables in tracked files together", async () => {
        state.files = {
            "lint/feature--a--1-x.csv": `${LINT_HEADER}\n2026-11-09,no-console,ui,error,0,claude-code\n`,
            "src/cli.ts": "// eslint-disable-next-line no-console -- prints\n",
        };
        state.git.mockResolvedValue("src/cli.ts\n");
        state.enabledRules.mockResolvedValue(["no-console", "no-eval"]);

        const { rules } = (await collectUsage(NOW)).lint;

        expect(state.enabledRules).toHaveBeenCalledWith(["src/cli.ts"]);
        expect(rules["no-console"]).toMatchObject({ enabled: true, hits: 1, disabled: 1 });
        expect(rules["no-eval"]).toMatchObject({ enabled: true, hits: 0 });
    });
});
