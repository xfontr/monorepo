import { describe, expect, it } from "vitest";
import {
    areaOf,
    callerOf,
    COLUMNS,
    flagLabels,
    LINT_COLUMNS,
    isCompleteLine,
    isRecorded,
    logFileFor,
    scriptOf,
    targetOf,
    toLine,
    type UsageRow,
} from "./usage.ts";

const row = (overrides: Partial<UsageRow> = {}): UsageRow => ({
    at: "2026-11-09",
    script: "issue",
    command: "pick",
    target: "",
    flags: "",
    area: "repo",
    caller: "human",
    tty: "1",
    exit: "0",
    ms: "12",
    ...overrides,
});

describe("flagLabels", () => {
    it("keeps the value of a closed-list flag and drops a free-text one", () => {
        expect(flagLabels(new Set(["type=fix", "title=Rotate the leaked token", "check"]))).toBe(
            "check;title;type=fix",
        );
    });

    it("cannot let a flag value open a new cell or a new flag", () => {
        expect(flagLabels(new Set(["project=A,B;C"]))).toBe("project=A B C");
    });
});

describe("toLine", () => {
    it("writes the columns in header order", () => {
        expect(toLine(row({ flags: "check" }))).toBe(
            "2026-11-09,issue,pick,,check,repo,human,1,0,12",
        );
    });

    it("keeps the separator between two flags", () => {
        expect(toLine(row({ flags: flagLabels(new Set(["check", "type=fix"])) }))).toContain(
            ",check;type=fix,",
        );
    });

    it("keeps a row one line with one cell per column whatever a value holds", () => {
        const line = toLine(row({ area: 'a,"b"\nc' }));

        expect(line).not.toContain("\n");
        expect(line.split(",")).toHaveLength(COLUMNS.length);
    });
});

describe("isCompleteLine", () => {
    it("drops a line cut short by a killed process, the header and blank lines", () => {
        expect(isCompleteLine(toLine(row()))).toBe(true);
        expect(isCompleteLine("2026-11-09,issue,pi")).toBe(false);
        expect(isCompleteLine(COLUMNS.join(","))).toBe(false);
        expect(isCompleteLine("")).toBe(false);
    });
});

describe("isCompleteLine for the lint log", () => {
    it("checks a lint row against the lint columns, not the script ones", () => {
        const line = "2026-11-09,no-console,ui,error,0,claude-code";

        expect(isCompleteLine(line, LINT_COLUMNS)).toBe(true);
        expect(isCompleteLine(line)).toBe(false);
    });
});

describe("callerOf", () => {
    it("names the agent from AI_AGENT without its version", () => {
        expect(callerOf({ AI_AGENT: "claude-code_2-1-319_agent", CLAUDECODE: "1" })).toBe(
            "claude-code",
        );
    });

    it("falls back to CLAUDECODE when AI_AGENT is unset", () => {
        expect(callerOf({ CLAUDECODE: "1" })).toBe("claude-code");
    });

    it("calls any other shell a human", () => {
        expect(callerOf({})).toBe("human");
    });
});

describe("isRecorded", () => {
    it("skips CI, test runs and the checks a git hook runs, none of which anyone chose", () => {
        expect(isRecorded({ CI: "true" }, "issue")).toBe(false);
        expect(isRecorded({ VITEST: "true" }, "issue")).toBe(false);
        expect(isRecorded({ MONOREPO_GIT_HOOK: "1" }, "map")).toBe(false);
        expect(isRecorded({}, "issue")).toBe(true);
    });

    it("skips the flush itself, which would otherwise refill the buffer it just emptied", () => {
        expect(isRecorded({}, "usage")).toBe(false);
    });
});

describe("areaOf", () => {
    it("reads the area segment of a branch the pre-push hook accepts", () => {
        expect(areaOf("feature/observability/289-choose-a-backend")).toBe("observability");
    });

    it("falls back to the repo for master and for a detached HEAD", () => {
        expect(areaOf("master")).toBe("repo");
        expect(areaOf("")).toBe("repo");
    });
});

describe("targetOf", () => {
    it("picks the positional that names a project and ignores an issue number", () => {
        expect(targetOf(["289", "huella-legal"], new Set(["huella-legal", "ui"]))).toBe(
            "huella-legal",
        );
        expect(targetOf(["289"], new Set(["ui"]))).toBe("");
    });
});

describe("logFileFor", () => {
    it("gives every branch its own flat file name", () => {
        expect(logFileFor("feature/observability/289-dx-telemetry")).toBe(
            "feature--observability--289-dx-telemetry.csv",
        );
    });
});

describe("scriptOf", () => {
    it("names the script after the folder its entry point sits in", () => {
        expect(scriptOf("/repo/infrastructure/scripts/src/issue/index.ts")).toBe("issue");
    });
});
