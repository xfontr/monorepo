import { mountSuspended } from "@nuxt/test-utils/runtime";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { defineComponent } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useReviewPages } from "./useReviewPages.ts";

const query = vi.hoisted(() => vi.fn());
const queryChain = vi.hoisted(() => ({ where: vi.fn(), select: vi.fn(), order: vi.fn(), all: vi.fn() }));
mockNuxtImport("queryCollection", () => query);
const Harness = defineComponent({
    setup: () => {
        clearNuxtData("reviews");
        return useReviewPages();
    },
    template: "<div />",
});

beforeEach(() => {
    vi.clearAllMocks();
    queryChain.where.mockReturnValue(queryChain);
    queryChain.select.mockReturnValue(queryChain);
    queryChain.order.mockReturnValue(queryChain);
    queryChain.all.mockResolvedValue([
        { path: "/docs/reviews/2026-09-20-new.md", title: "New", description: "" },
        { path: "/docs/reviews/2026-09-19-old.md", title: "Old", description: "" },
        { path: "/docs/reviews/README", title: "README", description: "" },
        { path: "/docs/reviews/TEMPLATE", title: "Template", description: "" },
    ]);
    query.mockReturnValue(queryChain);
});

describe("useReviewPages", () => {
    it("scopes, selects and orders the review query before removing furniture files", async () => {
        const wrapper = await mountSuspended(Harness);

        expect(query).toHaveBeenCalledWith("docs");
        expect(queryChain.where).toHaveBeenCalledWith("path", "LIKE", "/docs/reviews/%");
        expect(queryChain.select).toHaveBeenCalledWith("path", "title", "description");
        expect(queryChain.order).toHaveBeenCalledWith("path", "DESC");
        expect(wrapper.vm.data).toEqual([
            { path: "/docs/reviews/2026-09-20-new.md", title: "New", description: "" },
            { path: "/docs/reviews/2026-09-19-old.md", title: "Old", description: "" },
        ]);
    });

    it("uses an empty array as its default", async () => {
        queryChain.all.mockResolvedValue([]);
        const wrapper = await mountSuspended(Harness);

        expect(wrapper.vm.data).toEqual([]);
    });
});
