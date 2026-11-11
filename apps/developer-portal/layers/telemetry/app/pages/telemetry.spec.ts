import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Page from "./telemetry.vue";

const state = vi.hoisted(() => ({ snapshot: null as { value: unknown } | null }));
mockNuxtImport("useSnapshot", () => () => ({ data: state.snapshot }));

const global = {
    stubs: {
        UDashboardPanel: {
            template: "<section><slot name='header' /><slot name='body' /></section>",
        },
        UDashboardNavbar: { template: "<header><slot name='right' /></header>" },
        UDashboardSidebarCollapse: true,
        SnapshotAge: true,
        StatTile: {
            props: { label: String, value: [String, Number] },
            template: "<div class='tile'>{{ label }} {{ value }}</div>",
        },
        UCard: { template: "<article><slot name='header' /><slot /></article>" },
        UAlert: {
            props: { title: String, description: String },
            template: "<div class='empty'>{{ title }} {{ description }}</div>",
        },
        ScriptActivity: true,
        UsageTriage: true,
        LintUsage: true,
    },
};

const tally = (overrides: Record<string, unknown> = {}) => ({
    runs: 10,
    recent: 10,
    failures: 1,
    headless: 0,
    totalMs: 100,
    first: "2026-11-01",
    last: "2026-11-08",
    callers: { "claude-code": 4, human: 6 },
    commands: {},
    targets: {},
    areas: { content: 6, repo: 4 },
    flags: { check: 3 },
    days: { "2026-11-08": { runs: 10, agent: 4, failures: 1 } },
    ...overrides,
});

const artifact = (scripts: Record<string, unknown>, known = Object.keys(scripts)) => ({
    manifest: null,
    usage: {
        generatedAt: "2026-11-09T00:00:00.000Z",
        windowDays: 90,
        lint: { since: null, rules: {} },
        known,
        scripts,
    },
});

beforeEach(() => {
    state.snapshot = ref(null);
});

describe("telemetry page", () => {
    it("says nothing has been folded yet instead of showing an empty matrix as a result", async () => {
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.find(".empty").text()).toContain("No runs committed yet");
    });

    it("totals the window's runs, agent and failure shares, and counts a script with none as idle", async () => {
        state.snapshot!.value = artifact(
            {
                drift: tally(),
                map: tally({
                    runs: 500,
                    days: { "2026-11-08": { runs: 30, agent: 0, failures: 1 } },
                }),
            },
            ["drift", "map", "ship"],
        );

        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("Runs 40");
        expect(wrapper.text()).toContain("Run by an agent 10%");
        expect(wrapper.text()).toContain("Failed 5%");
        expect(wrapper.text()).toContain("Idle scripts 1/3");
    });
});
