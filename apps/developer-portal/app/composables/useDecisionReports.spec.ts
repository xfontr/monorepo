import { mountSuspended } from "@nuxt/test-utils/runtime";
import { defineComponent, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDecisionReports } from "./useDecisionReports.ts";

const state = vi.hoisted(() => ({ snapshot: null as { value: unknown } | null }));
vi.mock("./useSnapshot.ts", () => ({ useSnapshot: () => ({ data: state.snapshot }) }));
state.snapshot = ref(null);

const Harness = defineComponent({ setup: () => ({ reports: useDecisionReports() }), template: "<div />" });

beforeEach(() => {
    state.snapshot!.value = null;
});

describe("useDecisionReports", () => {
    it("returns no reports while the docs snapshot is absent", async () => {
        const wrapper = await mountSuspended(Harness);

        expect(wrapper.vm.reports).toEqual([]);
    });

    it("derives decision reports from pages and reacts when the snapshot changes", async () => {
        const wrapper = await mountSuspended(Harness);
        state.snapshot!.value = {
            docs: {
                pages: [{
                    path: "docs/decisions/0007-use-a-cache.md",
                    kind: "decision",
                    title: "🧭 Use a cache",
                    words: 20,
                    updatedAt: "2026-09-20",
                    decisionStatus: "implemented",
                    decisionOutcome: "accepted",
                    decisionSupersededBy: null,
                    brokenLinks: [],
                }] as never[],
            },
        };
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.reports).toEqual([expect.objectContaining({ id: "0007-use-a-cache", title: "Use a cache" })]);
    });
});
