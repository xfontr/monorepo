import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import SkeletonList from "./SkeletonList.vue";

const global = { mocks: { $t: (key: string) => `t(${key})` } };

describe("skeleton list", () => {
    it("announces the load once instead of reading out empty placeholder rows", async () => {
        const wrapper = await mountSuspended(SkeletonList, { global });

        expect(wrapper.attributes("aria-busy")).toBe("true");
        expect(wrapper.find("[role=status]").text()).toBe("t(skeletonList.loading)");
        expect(wrapper.find("ul").attributes("aria-hidden")).toBe("true");
    });

    it("draws three rows by default, or as many as asked", async () => {
        const fallback = await mountSuspended(SkeletonList, { global });
        const five = await mountSuspended(SkeletonList, { props: { rows: 5 }, global });

        expect(fallback.findAll("li")).toHaveLength(3);
        expect(five.findAll("li")).toHaveLength(5);
    });
});
