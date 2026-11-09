import { afterEach, describe, expect, it, vi } from "vitest";
import {
    capabilityColor,
    capabilityFilled,
    coverageTone,
    decisionOutcomeLabel,
    decisionStatusLabel,
    decisionStatusTone,
    kindIcon,
    relativeTime,
    scoreTone,
    severityTone,
    stageColor,
} from "./format.ts";

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

describe("kindIcon", () => {
    it("returns known icons and a fallback icon for unknown kinds", () => {
        expect(kindIcon("readme")).toBe("i-lucide-file-text");
        expect(kindIcon("unknown")).toBe("i-lucide-file-text");
    });
});

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

describe("relativeTime", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns never for missing timestamps", () => {
        expect(relativeTime(null)).toBe("never");
        expect(relativeTime(undefined)).toBe("never");
    });

    it.each([
        ["2026-09-20T11:59:58.000Z", "2 seconds ago"],
        ["2026-09-20T10:00:00.000Z", "2 hours ago"],
        ["2026-09-18T12:00:00.000Z", "2 days ago"],
    ])("chooses the largest useful unit for %s", (timestamp, label) => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-09-20T12:00:00.000Z"));

        expect(relativeTime(timestamp)).toBe(label);
    });
});

describe("capability marks", () => {
    it.each([
        ["done", "var(--tone-good)", true],
        ["in-progress", "var(--tone-warn)", true],
        ["planned", "var(--tone-warn)", false],
        ["todo", "var(--ui-text-dimmed)", false],
        ["off", "var(--ui-text-dimmed)", false],
        ["skipped", "var(--ui-text-dimmed)", true],
    ] as const)(
        "draws %s as %s, filled: %s, so state reads without colour",
        (state, colour, filled) => {
            expect(capabilityColor(state)).toBe(colour);
            expect(capabilityFilled(state)).toBe(filled);
        },
    );

    it("wraps the stage palette instead of running off its end", () => {
        expect(stageColor(7)).toBe(stageColor(0));
    });
});
