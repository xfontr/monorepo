import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import type { ScriptUsage, UsageArtifact } from "#layers/snapshot/shared/types.ts";
import ScriptActivity from "./ScriptActivity.vue";

const global = {
    stubs: {
        UCard: { template: "<article><slot name='header' /><slot /></article>" },
        DayStrip: true,
        CallerSplit: true,
    },
};

const map: ScriptUsage = {
    runs: 8,
    recent: 8,
    failures: 2,
    headless: 8,
    totalMs: 800,
    first: "2026-11-08T13:04:27.729Z",
    last: "2026-11-08T13:04:27.729Z",
    callers: { "claude-code": 8 },
    commands: {},
    targets: {},
    areas: {},
    flags: {},
    days: { "2026-11-08": { runs: 8, agent: 8, failures: 2 } },
};

const usage: Omit<UsageArtifact, "lint"> = {
    generatedAt: "2026-11-09T00:00:00.000Z",
    windowDays: 90,
    known: ["map", "env-sync"],
    scripts: { map },
};

describe("ScriptActivity", () => {
    it("keeps a script that never ran as a row that says so, rather than hiding it", async () => {
        const wrapper = await mountSuspended(ScriptActivity, { props: { usage }, global });

        const rows = wrapper
            .findAll("tbody tr")
            .map((row) => row.findAll("td").map((td) => td.text()));

        expect(rows[1]).toEqual(["env-sync", "", "—", "", "—", "never"]);
    });

    it("marks a failing script's rate in the bad tone, so the column isn't read by number alone", async () => {
        const wrapper = await mountSuspended(ScriptActivity, { props: { usage }, global });

        const failed = wrapper.findAll("tbody tr")[0]?.findAll("td")[4];

        expect(failed?.text()).toBe("25%");
        expect(failed?.classes()).toContain("tone-bad");
    });
});
