import { describe, expect, it } from "vitest";
import { capabilityColor, capabilityFilled, stageColor } from "./format.ts";

describe("capability marks", () => {
    it.each([
        ["done", "var(--state-done)", true],
        ["in-flight", "var(--state-in-flight)", true],
        ["ready", "var(--state-ready)", true],
        ["waiting-on-you", "var(--state-waiting-on-you)", true],
        ["blocked", "var(--state-blocked)", false],
        ["can-file", "var(--state-can-file)", false],
        ["waits", "var(--state-waits)", false],
        ["off", "var(--state-off)", false],
        ["skipped", "var(--state-skipped)", true],
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
