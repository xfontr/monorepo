import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import type { LintRuleUsage } from "#layers/snapshot/shared/types.ts";
import LintUsage from "./LintUsage.vue";

const global = {
    stubs: {
        UCard: { template: "<article><slot name='header' /><slot /></article>" },
        UAlert: {
            props: { title: String, description: String },
            template: "<div class='alert'>{{ title }} {{ description }}</div>",
        },
    },
};

const rule = (overrides: Partial<LintRuleUsage> = {}): LintRuleUsage => ({
    enabled: true,
    hits: 0,
    recent: 0,
    fixable: 0,
    last: null,
    projects: {},
    disabled: 0,
    ...overrides,
});

const mount = (rules: Record<string, LintRuleUsage>, since: string | null = "2026-11-01") =>
    mountSuspended(LintUsage, { props: { lint: { since, rules }, windowDays: 90 }, global });

describe("LintUsage", () => {
    it("says the counts only cover agent edits, so a quiet rule isn't read as unused by people", async () => {
        const wrapper = await mount({});

        expect(wrapper.find(".alert").text()).toContain("agent edits only");
    });

    it("tables a rule that fired or is disabled, busiest first, and leaves silent ones out", async () => {
        const wrapper = await mount({
            silent: rule(),
            disabledOnly: rule({ disabled: 2 }),
            busy: rule({ hits: 9, recent: 9, projects: { ui: 9 } }),
        });

        expect(wrapper.findAll("tbody tr").map((row) => row.find("td").text())).toEqual([
            "busy",
            "disabledOnly",
        ]);
    });

    it("counts never-fired rules against how long they have been watched", async () => {
        const wrapper = await mount({ silent: rule(), busy: rule({ hits: 1, recent: 1 }) });

        expect(wrapper.text()).toContain("Never fired: 1 of 2 enabled rules");
        expect(wrapper.text()).toContain("Watching since 2026-11-01");
    });
});
