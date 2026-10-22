import { describe, expect, it } from "vitest";
import { excerpt, stripAnsi } from "./logs.ts";

const ESC = "\u001b";

// Trimmed from a real `tsc --noEmit` failure inside an Nx task log.
const TSC_LOG = [
    "$ tsc --noEmit",
    `${ESC}[96msrc/shared/domain/broken.ts${ESC}[0m:${ESC}[93m1${ESC}[0m:${ESC}[93m14${ESC}[0m - ${ESC}[91merror${ESC}[0m${ESC}[90m TS2322: ${ESC}[0mType 'string' is not assignable to type 'number'.`,
    "",
    "",
    "Found 1 error in src/shared/domain/broken.ts:1",
    "",
    "[ELIFECYCLE] Command failed with exit code 2.",
].join("\n");

const passingLines = (count: number): string[] =>
    Array.from({ length: count }, (_, index) => ` ✓ spec-${index}.spec.ts (3 tests)`);

describe("stripAnsi", () => {
    it("removes colour codes and carriage returns so patterns match the visible text", () => {
        expect(stripAnsi(`${ESC}[31merror${ESC}[39m\r`)).toBe("error");
    });
});

describe("excerpt", () => {
    it("keeps a short log whole, minus the lifecycle noise and repeated blank lines", () => {
        expect(excerpt(TSC_LOG)).toEqual({
            lines: [
                "$ tsc --noEmit",
                "src/shared/domain/broken.ts:1:14 - error TS2322: Type 'string' is not assignable to type 'number'.",
                "",
                "Found 1 error in src/shared/domain/broken.ts:1",
            ],
            omitted: 0,
        });
    });

    it("drops the Nx Cloud access warning, which every local run prints and no fix needs", () => {
        const log =
            "real line\n NX   Nx Cloud encountered some problems\nYou do not have sufficient access to this workspace.";

        expect(excerpt(log).lines).toEqual(["real line"]);
    });

    it("keeps the failing test and its assertion when the passing ones would bury them", () => {
        const log = [
            ...passingLines(30),
            " FAIL  app/useArticleListing.spec.ts > loads the first page",
            "Error: Hook timed out in 10000ms.",
            ...passingLines(30),
        ].join("\n");

        const { lines, omitted } = excerpt(log, 10);

        expect(lines).toContain(" FAIL  app/useArticleListing.spec.ts > loads the first page");
        expect(lines).toContain("Error: Hook timed out in 10000ms.");
        expect(lines.length).toBeLessThanOrEqual(10);
        expect(omitted).toBeGreaterThan(50);
    });

    it("does not treat a passing spec named after errors as an error line", () => {
        const log = [...passingLines(30), " ✓ app/error.spec.ts (10 tests)", ...passingLines(30)];

        expect(excerpt(log.join("\n"), 10).lines).not.toContain(" ✓ app/error.spec.ts (10 tests)");
    });

    it("reads GitHub's spelled-out escape codes as colour, not text", () => {
        expect(stripAnsi("^[[31mError^[[39m: Hook timed out")).toBe("Error: Hook timed out");
    });

    it("marks the gap between two error windows so a reader knows lines are missing", () => {
        const log = ["error one", ...passingLines(20), "error two", ...passingLines(20)].join("\n");

        expect(excerpt(log, 20).lines).toContain("…");
    });

    it("never exceeds the cap when the next window needs a gap marker as well as its line", () => {
        const log = ["error one", ...passingLines(20), "error two", ...passingLines(20)].join("\n");

        expect(excerpt(log, 6).lines).toHaveLength(5);
    });

    it("falls back to the tail when nothing in an oversized log looks like an error", () => {
        const { lines } = excerpt(passingLines(50).join("\n"), 5);

        expect(lines).toEqual(passingLines(50).slice(-5));
    });
});
