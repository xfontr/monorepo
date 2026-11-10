import { describe, expect, it } from "vitest";
import { decisionOutcomeLabel, decisionStatusLabel, decisionStatusTone } from "./format.ts";

describe("decision labels and tones", () => {
    it.each([
        ["to-implement", "To implement", "warn"],
        ["implemented", "Implemented", "good"],
        ["wont-implement", "Won't implement", "neutral"],
    ] as const)("maps %s to its status label and tone", (status, label, tone) => {
        expect(decisionStatusLabel(status)).toBe(label);
        expect(decisionStatusTone(status)).toBe(tone);
    });

    it.each([
        ["accepted", "Accepted"],
        ["superseded", "Superseded"],
    ] as const)("labels the %s outcome", (outcome, label) => {
        expect(decisionOutcomeLabel(outcome)).toBe(label);
    });
});
