import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { readTemplate } from "#layers/workflows/shared/workflows.ts";
import TemplatePicker from "./TemplatePicker.vue";

const template = (id: string, title: string) =>
    readTemplate({
        id,
        title,
        stages: [{ id: "build", title: "Build" }],
        capabilities: [{ id: "kit", stage: "build", title: "Kit", complexity: 3 }],
    }).template;

const mount = () =>
    mountSuspended(TemplatePicker, {
        props: {
            templates: [template("new-website", "New website"), template("rebuild", "Rebuild")],
            modelValue: "new-website",
        },
        global: { stubs: { UIcon: true } },
    });

describe("TemplatePicker", () => {
    it("marks only the chosen template and reports the one clicked", async () => {
        const wrapper = await mount();
        const [chosen, other] = wrapper.findAll("[role='radio']");

        expect(chosen!.attributes("aria-checked")).toBe("true");
        expect(other!.attributes("aria-checked")).toBe("false");

        await other!.trigger("click");

        expect(wrapper.emitted("update:modelValue")).toEqual([["rebuild"]]);
    });

    it("prices each template in blocks, tickets and points before it is picked", async () => {
        const wrapper = await mount();

        expect(wrapper.findAll("[role='radio']")[1]!.text()).toContain(
            "1 blocks by default · 1–1 tickets · 3 SP",
        );
    });
});
