import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { readTemplate } from "#layers/workflows/shared/workflows.ts";
import RequiredBlocks from "./RequiredBlocks.vue";

const { template } = readTemplate({
    id: "site",
    title: "Site",
    stages: [
        { id: "plan", title: "Plan" },
        { id: "build", title: "Build" },
    ],
    groups: [{ id: "blog", title: "Blog", optional: true, default: true }],
    capabilities: [
        { id: "signoff", stage: "plan", title: "Sign-off", kind: "owner" },
        { id: "home", stage: "build", title: "Home page" },
        { id: "post", stage: "build", group: "blog", title: "Post page" },
        { id: "search", stage: "build", title: "Search", optional: true },
    ],
});

describe("RequiredBlocks", () => {
    it("lists only the blocks no switch can remove, under their stage", async () => {
        const text = (await mountSuspended(RequiredBlocks, { props: { template } })).text();

        expect(text).toContain("2 blocks");
        expect(text).toContain("Sign-off");
        expect(text).toContain("Home page");
        expect(text).not.toContain("Post page");
        expect(text).not.toContain("Search");
    });
});
