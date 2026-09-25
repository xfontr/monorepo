import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Page from "./scorecards.vue";

const state = vi.hoisted(() => ({ snapshot: { value: null as unknown } }));
mockNuxtImport("useSnapshot", () => () => ({ data: state.snapshot }));

const global = { stubs: {
    UDashboardPanel: { template: "<section><slot name='header' /><slot name='body' /></section>" }, UDashboardNavbar: { template: "<header><slot name='right' /></header>" }, UDashboardSidebarCollapse: true, SnapshotAge: true,
    StatTile: { props: { label: String, value: [String, Number], hint: String }, template: "<div class='tile'>{{ label }} {{ value }} {{ hint }}</div>" }, UCard: { template: "<article><slot name='header' /><slot /></article>" },
    UAlert: { props: { title: String, description: String }, template: "<div>{{ title }} {{ description }}</div>" }, UButton: { props: { to: String }, template: "<a :href='to'>rubric</a>" }, NuxtLink: { props: { to: String }, template: "<a :href='to'><slot /></a>" },
} };

const review = (date: string, total: number, parseError: string | null = null) => ({ path: `docs/reviews/${date}-abc.md`, date, commit: "abc", total, totalDelta: "—", parseError, cards: [{ card: "Architecture", score: 2, delta: "", verdict: "weak" }] });
beforeEach(() => {
    state.snapshot.value = null;
});

describe("scorecards page", () => {
    it("shows the absent state when no reviews were collected", async () => {
        state.snapshot.value = { scorecards: { reviews: [] }, manifest: {} };
        const wrapper = await mountSuspended(Page, { global });
        expect(wrapper.text()).toContain("No review under");
    });

    it("uses the latest review for totals, weakest card and review metadata", async () => {
        state.snapshot.value = { scorecards: { reviews: [review("2026-09-20", 3), review("2026-09-19", 4)] }, manifest: {} };
        const wrapper = await mountSuspended(Page, { global });
        expect(wrapper.text()).toContain("3/5");
        expect(wrapper.text()).toContain("2026-09-20");
        expect(wrapper.text()).toContain("Architecture");
        expect(wrapper.text()).toContain("2/5");
        expect(wrapper.findAll("a").length).toBeGreaterThan(1);
    });

    // The collector keys a review by its repo path, so a link built from it verbatim ends in `.md` and opens "No such review".
    it("links each review to its route rather than to its markdown filename", async () => {
        state.snapshot.value = { scorecards: { reviews: [review("2026-09-20", 3), review("2026-09-19", 4)] }, manifest: {} };
        const wrapper = await mountSuspended(Page, { global });
        const reviewLinks = wrapper.findAll("a").map((link) => link.attributes("href")).filter((href) => href?.startsWith("/reviews/"));

        expect(reviewLinks).toContain("/reviews/2026-09-20-abc");
        expect(reviewLinks).toContain("/reviews/2026-09-19-abc");
        expect(reviewLinks.filter((href) => href?.endsWith(".md"))).toEqual([]);
    });

    it("shows parse errors, preserves newest-first history, and leaves weakest absent for empty cards", async () => {
        state.snapshot.value = { scorecards: { reviews: [
            { ...review("2026-09-20", 0, "bad table"), cards: [] },
            review("2026-09-19", 4),
        ] }, manifest: {} };
        const wrapper = await mountSuspended(Page, { global });
        expect(wrapper.text()).toContain("bad table");
        expect(wrapper.text()).toContain("Weakest card —");
        expect(wrapper.text()).toContain("History");
    });
});
