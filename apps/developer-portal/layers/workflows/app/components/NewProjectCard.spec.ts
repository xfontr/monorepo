import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import NewProjectCard from "./NewProjectCard.vue";

describe("NewProjectCard", () => {
    it("names the link for screen readers, since the card shows only a plus", async () => {
        const wrapper = await mountSuspended(NewProjectCard, { props: { label: "New project" } });
        const link = wrapper.find("a[href='/workflows/new']");

        expect(link.attributes("aria-label")).toBe("New project");
    });
});
