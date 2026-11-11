import { describe, expect, it } from "vitest";
import { complexityOf, pointsLine } from "./complexity.ts";
import type { Capability } from "./types.ts";

const block = (complexity: number | null) => ({ complexity }) as Capability;

describe("complexityOf", () => {
    it("adds nothing for an unestimated block instead of turning the total into NaN", () => {
        expect(complexityOf([block(5), block(null), block(8)])).toBe(13);
    });
});

describe("pointsLine", () => {
    it("rounds a split ticket's share so the page never shows 2.6666 SP", () => {
        expect(pointsLine({ done: 2.6666, total: 8, estimated: 0, unestimated: 0 })).toBe(
            "3 of 8 SP done",
        );
    });

    it("says how much of the total is still a guess and how much has no figure", () => {
        expect(pointsLine({ done: 0, total: 21, estimated: 13, unestimated: 2 })).toBe(
            "0 of 21 SP done · 13 still template estimates · 2 unestimated",
        );
    });
});
