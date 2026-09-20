import { describe, expect, it } from "vitest";
import { CancelledError, ExpectedError } from "../errors.ts";
import { dispatch, invocation, parse, report } from "./cli.ts";

describe("parse", () => {
    it("separates flags from positionals", () => {
        expect(parse(["add", "--check", "issue-42"])).toEqual({
            flags: new Set(["check"]),
            positionals: ["add", "issue-42"],
        });
    });
});

describe("dispatch", () => {
    const commands = { add: "add command", pick: "pick command" };

    it("selects the named command", () => {
        expect(dispatch(commands, parse(["pick"]), "node issue.ts")).toEqual({
            matched: true,
            command: "pick command",
            args: { flags: new Set(), positionalsWithoutCommandName: [] },
        });
    });

    it("removes the command name while preserving flags and remaining positionals", () => {
        expect(dispatch(commands, parse(["add", "--check", "issue-42"]), "node issue.ts")).toEqual({
            matched: true,
            command: "add command",
            args: { flags: new Set(["check"]), positionalsWithoutCommandName: ["issue-42"] },
        });
    });

    it.each([[[]], [["missing"]]])("returns usage when the command is %j", (positionals) => {
        expect(dispatch(commands, parse(positionals), "node issue.ts")).toEqual({
            matched: false,
            usage: "Usage: node issue.ts <add|pick>",
        });
    });
});

describe("invocation", () => {
    it("keeps an entry inside cwd relative", () => {
        expect(invocation("/repo/src/index.ts", "/repo")).toBe("node src/index.ts");
    });

    it("keeps an entry outside cwd absolute", () => {
        expect(invocation("/other/src/index.ts", "/repo")).toBe("node /other/src/index.ts");
    });
});

describe("report", () => {
    it.each([
        [new CancelledError("cancelled"), { cancelled: true, message: "cancelled" }],
        [new ExpectedError("expected"), { cancelled: false, message: "expected" }],
    ])("classifies %s", (error, expected) => {
        expect(report(error)).toEqual(expected);
    });

    it("keeps stderr detail with an unexpected error", () => {
        const error = Object.assign(new Error("unexpected"), { stderr: Buffer.from("detail") });

        expect(report(error).message).toContain("detail");
    });
});
