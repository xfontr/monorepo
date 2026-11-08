import { describe, expect, it } from "vitest";
import { parseEnv, render, toLines } from "./envFile.ts";

describe("parseEnv", () => {
    it("tells a commented-out assignment from a prose comment, so the first is kept as data", () => {
        const parsed = parseEnv("# MAIL — the sender\n# MAIL_FROM=old@example.com\nMAIL_KEY=abc\n");

        expect(parsed.problem).toBeUndefined();
        expect(parsed.lines?.map((line) => line.kind)).toStrictEqual([
            "comment",
            "commented",
            "entry",
        ]);
    });

    it("keeps a multi-line quoted value as one entry, so its continuation lines can't be reordered away", () => {
        const parsed = parseEnv('KEY="-----BEGIN\nabc\n-----END"\nNEXT=1\n');

        expect(parsed.lines).toStrictEqual([
            { kind: "entry", key: "KEY", lines: ['KEY="-----BEGIN', "abc", '-----END"'] },
            { kind: "entry", key: "NEXT", lines: ["NEXT=1"] },
        ]);
    });

    it("does not end a quoted value at an escaped quote", () => {
        const parsed = parseEnv('KEY="a \\" b\nc"\n');

        expect(parsed.lines).toStrictEqual([
            { kind: "entry", key: "KEY", lines: ['KEY="a \\" b', 'c"'] },
        ]);
    });

    it.each([
        ["a quote that never closes", 'KEY="abc\nNEXT=1\n', /never closes/],
        ["a key set twice, where which one wins is a guess", "KEY=1\nKEY=2\n", /set twice/],
        ["a line that is no assignment", "KEY=1\nnot an assignment\n", /line 2/],
        ["CRLF line endings", "KEY=1\r\n", /CRLF/],
    ])("refuses a file with %s rather than rewriting it", (_, text, problem) => {
        expect(parseEnv(text).problem).toMatch(problem);
    });

    it("accepts export prefixes and inline comments as part of the line", () => {
        expect(parseEnv("export KEY=1 # note\n").lines).toStrictEqual([
            { kind: "entry", key: "KEY", lines: ["export KEY=1 # note"] },
        ]);
    });
});

describe("toLines and render", () => {
    it("round-trips a file's trailing blank line instead of eating it", () => {
        const text = "A=1\n\n";

        expect(render(toLines(text))).toBe(text);
    });

    it("renders no lines as an empty file rather than a lone newline", () => {
        expect(render([])).toBe("");
    });
});
