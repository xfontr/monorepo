import { afterEach, describe, expect, it, vi } from "vitest";
import { relativeTime } from "./format.ts";

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
