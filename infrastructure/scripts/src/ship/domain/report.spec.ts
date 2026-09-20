import { describe, expect, it } from "vitest";
import { shipMessage, shipReport } from "./report.ts";

describe("shipMessage", () => {
    it("reports the check failure and leaves merged out of it, even if the caller also passed merged: true", () => {
        expect(shipMessage({ checksPassed: false, merged: true })).toBe("❌ a check failed — PR left open.");
    });

    it("reports the merge once checks passed and auto-merge already landed it", () => {
        expect(shipMessage({ checksPassed: true, merged: true })).toBe("✅ pipelines green, PR auto-merged.");
    });

    it("reports a queued merge when checks passed but the merge hasn't landed yet", () => {
        expect(shipMessage({ checksPassed: true, merged: false })).toBe("✅ pipelines green, merge queued — should land shortly.");
    });
});

describe("shipReport", () => {
    it.each([
        [{ checksPassed: false, merged: false }, {
            message: "❌ a check failed — PR left open.",
            exitCode: 1,
            syncMaster: false,
        }],
        [{ checksPassed: true, merged: false }, {
            message: "✅ pipelines green, merge queued — should land shortly.",
            exitCode: undefined,
            syncMaster: false,
        }],
        [{ checksPassed: true, merged: true }, {
            message: "✅ pipelines green, PR auto-merged.",
            exitCode: undefined,
            syncMaster: true,
        }],
    ])("reports the message, exit status and master-sync action for %j", (outcome, expected) => {
        expect(shipReport(outcome)).toEqual(expected);
    });
});
