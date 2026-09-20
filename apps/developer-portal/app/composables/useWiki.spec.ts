import { mountSuspended } from "@nuxt/test-utils/runtime";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { defineComponent } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWiki } from "./useWiki.ts";

const query = vi.hoisted(() => vi.fn());
const chain = vi.hoisted(() => ({ select: vi.fn(), all: vi.fn() }));
mockNuxtImport("queryCollection", () => query);
const Harness = defineComponent({
    setup: () => {
        clearNuxtData("wiki");
        return useWiki();
    },
    template: "<div />",
});

beforeEach(() => {
    vi.clearAllMocks();
    chain.select.mockReturnValue(chain);
    chain.all.mockResolvedValue([
        { path: "README.md", title: "README" },
        { path: "docs/README.md", title: "Docs" },
    ]);
    query.mockReturnValue(chain);
});

describe("useWiki", () => {
    it("selects only navigation fields and builds the shared wiki tree", async () => {
        const wrapper = await mountSuspended(Harness);

        expect(query).toHaveBeenCalledWith("docs");
        expect(chain.select).toHaveBeenCalledWith("path", "title");
        expect(wrapper.vm.data).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: "workspace" }),
            expect.objectContaining({ id: "docs" }),
        ]));
    });

    it("starts with an empty navigation array and the shared wiki key", async () => {
        chain.all.mockResolvedValue([]);
        const wrapper = await mountSuspended(Harness);

        expect(wrapper.vm.data).toEqual([]);
        expect(wrapper.vm).toHaveProperty("status");
    });
});
