import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { readTemplate } from "#layers/workflows/shared/workflows.ts";
import PagePicker from "./PagePicker.vue";

const { template } = readTemplate({
    id: "site",
    title: "Site",
    stages: [{ id: "build", title: "Build" }],
    types: [
        { id: "content-page", stage: "build", title: "Content page", complexity: 2 },
        { id: "custom-page", stage: "build", title: "Custom page", complexity: 5 },
    ],
});

interface Page {
    key: number;
    type: string;
    title: string;
}

const mount = (pages: Page[] = [], errors: (string | null)[] = []) =>
    mountSuspended(PagePicker, {
        props: { template, errors, modelValue: pages },
    });

const lastModel = (wrapper: Awaited<ReturnType<typeof mount>>) =>
    wrapper.emitted("update:modelValue")?.at(-1)?.[0] as Page[] | undefined;

describe("PagePicker", () => {
    it("offers one button per page type, priced, so a page's cost is known before it is added", async () => {
        const labels = (await mount()).findAll("button").map((button) => button.text());

        expect(labels).toEqual(["Content page · 2 SP", "Custom page · 5 SP"]);
    });

    it("drops a new block left unnamed instead of keeping a page with no title", async () => {
        const wrapper = await mount([{ key: 1, type: "custom-page", title: "" }]);
        await wrapper.findAll("button")[1]?.trigger("click");
        await wrapper.setProps({ modelValue: lastModel(wrapper) });

        await wrapper.find("input[aria-label='Custom page name']").trigger("blur");

        expect(lastModel(wrapper)).toEqual([{ key: 1, type: "custom-page", title: "" }]);
    });

    it("keeps a block open while its name clashes, so the problem can't be saved", async () => {
        const wrapper = await mount([]);
        await wrapper.findAll("button")[1]?.trigger("click");
        await wrapper.setProps({
            modelValue: [{ key: 1, type: "custom-page", title: "Search" }],
            errors: ["`search-page` is already a block of the template"],
        });

        await wrapper.find("input").trigger("keydown", { key: "Enter" });

        expect(wrapper.find("input").exists()).toBe(true);
        expect(wrapper.text()).toContain("already a block of the template");
    });

    it("shows a saved page's type and points, and removes it with its X", async () => {
        const wrapper = await mount([{ key: 1, type: "custom-page", title: "Services" }]);

        expect(wrapper.find("li").text()).toContain("Custom page");
        expect(wrapper.find("li").text()).toContain("5 SP");

        await wrapper.find("[aria-label='Remove Services']").trigger("click");

        expect(lastModel(wrapper)).toEqual([]);
    });

    it("prices the first blog with comments with the setup and the next one without", async () => {
        const { template: blogs } = readTemplate({
            id: "site",
            title: "Site",
            stages: [{ id: "build", title: "Build" }],
            capabilities: [
                {
                    id: "comments",
                    stage: "build",
                    title: "Comments setup",
                    complexity: 8,
                    onDemand: true,
                },
            ],
            types: [
                {
                    id: "blog-comments",
                    stage: "build",
                    title: "Blog + comments",
                    complexity: 13,
                    dependsOn: ["comments"],
                },
            ],
        });
        const mountBlogs = (pages: Page[]) =>
            mountSuspended(PagePicker, {
                props: { template: blogs, errors: [], modelValue: pages },
            });

        expect((await mountBlogs([])).find("button").text()).toBe("Blog + comments · 21 SP");

        const wrapper = await mountBlogs([
            { key: 1, type: "blog-comments", title: "News" },
            { key: 2, type: "blog-comments", title: "Notes" },
        ]);
        const [first, second] = wrapper.findAll("li").map((card) => card.text());

        expect(wrapper.find("button").text()).toBe("Blog + comments · 13 SP");
        expect(first).toContain("21 SP");
        expect(first).toContain("Includes Comments setup, 8 SP");
        expect(second).toContain("13 SP");
        expect(second).toContain("Comments setup already counted");
    });
});
