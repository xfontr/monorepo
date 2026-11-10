import { describe, expect, it } from "vitest";
import { scoreTone } from "./format.ts";

describe("scoreTone", () => {
    it.each([
        [null, "neutral"],
        [undefined, "neutral"],
        [2.99, "bad"],
        [3, "warn"],
        [3.99, "warn"],
        [4, "good"],
    ] as const)("maps %s to %s", (value, tone) => {
        expect(scoreTone(value)).toBe(tone);
    });
});
