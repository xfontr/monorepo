import { describe, expect, it } from "vitest";
import { coverageTone, severityTone } from "./format.ts";

describe("coverageTone", () => {
    it.each([
        [null, "neutral"],
        [undefined, "neutral"],
        [59.99, "bad"],
        [60, "warn"],
        [79.99, "warn"],
        [80, "good"],
    ] as const)("maps %s to %s", (value, tone) => {
        expect(coverageTone(value)).toBe(tone);
    });
});

describe("severityTone", () => {
    it.each([
        ["info", "neutral"],
        ["low", "neutral"],
        ["moderate", "warn"],
        ["high", "bad"],
        ["critical", "bad"],
    ] as const)("collapses %s severity to %s", (severity, tone) => {
        expect(severityTone(severity)).toBe(tone);
    });
});
