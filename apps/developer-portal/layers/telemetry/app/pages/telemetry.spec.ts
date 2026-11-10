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
        UIcon: true,
        LintUsage: true,
    },
};

const tally = (overrides: Record<string, unknown> = {}) => ({
    runs: 10,
    recent: 10,
    failures: 1,
    headless: 0,
    totalMs: 100,
    first: "2026-11-01T00:00:00.000Z",
    last: "2026-11-08T00:00:00.000Z",
    callers: { "claude-code": 4, human: 6 },
    commands: {},
    targets: {},
    areas: { content: 6, repo: 4 },
    flags: { check: 3 },
    ...overrides,
});

beforeEach(() => {
    state.snapshot = ref(null);
});

describe("telemetry page", () => {
    it("says nothing has been folded yet instead of showing an empty table as a result", async () => {
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.find(".empty").text()).toContain("No runs committed yet");
    });

    it("totals runs and the agent and failure shares across scripts, busiest script first", async () => {
        state.snapshot!.value = {
            manifest: null,
            usage: {
                generatedAt: "2026-11-09T00:00:00.000Z",
                windowDays: 90,
                lint: { since: null, rules: {} },
                known: ["drift", "map"],
                scripts: {
                    drift: tally({ runs: 10 }),
                    map: tally({ runs: 30, recent: 30, callers: { human: 30 } }),
                },
            },
        };

        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("Runs 40");
        expect(wrapper.text()).toContain("Run by an agent 10%");
        expect(wrapper.text()).toContain("Failed 5%");
        expect(wrapper.findAll("tbody tr").map((row) => row.find("td").text())).toEqual([
            "map",
            "drift",
        ]);
    });

    it("lists a script that was never run among the things worth a look", async () => {
        state.snapshot!.value = {
            manifest: null,
            usage: {
                generatedAt: "2026-11-09T00:00:00.000Z",
                windowDays: 90,
                lint: { since: null, rules: {} },
                known: ["drift", "map"],
                scripts: { drift: tally() },
            },
        };

        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("Worth a look");
        expect(wrapper.text()).toContain("map");
        expect(wrapper.text()).toContain("Nothing recorded");
    });
});
