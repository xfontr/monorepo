import { describe, expect, it } from "vitest";
import { CancelledError, ExpectedError } from "../errors.ts";
import { invocation, parse, report } from "./cli.ts";

describe("parse", () => {
    it("separates flags from positionals", () => {
        expect(parse(["add", "--check", "issue-42"])).toEqual({
            flags: new Set(["check"]),
            positionals: ["add", "issue-42"],
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
