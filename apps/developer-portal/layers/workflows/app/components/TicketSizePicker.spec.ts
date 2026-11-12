import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import TicketSizePicker from "./TicketSizePicker.vue";

const mount = () =>
    mountSuspended(TicketSizePicker, {
        props: {
            modelValue: "block",
            counts: { block: 17, supervised: 8, fast: 7 },
            editable: true,
        },
    });

describe("TicketSizePicker", () => {
    it("prices every size in tickets, so the choice is made on the number", async () => {
        const options = (await mount()).findAll("[role='radio']").map((option) => option.text());

        expect(options[0]).toMatch(/^17\s*tickets/);
        expect(options[2]).toMatch(/^7\s*tickets/);
    });

    it("shows no ticket count when given none, as settings does once the size is chosen", async () => {
        const wrapper = await mountSuspended(TicketSizePicker, {
            props: { modelValue: "block" },
        });

        const options = wrapper.findAll("[role='radio']").map((option) => option.text());

        expect(options[0]).toMatch(/^Reviewed/);
        expect(options[2]).toMatch(/^Fast/);
    });

    it("warns that a size bundling blocks is for AI-run projects, and stays quiet for one per block", async () => {
        expect((await mount()).text()).not.toContain("Meant for AI-run projects");

        const wrapper = await mountSuspended(TicketSizePicker, { props: { modelValue: "fast" } });
        expect(wrapper.text()).toContain("Meant for AI-run projects");
    });

    it("marks only the current size as chosen and reports the one clicked", async () => {
        const wrapper = await mount();
        const options = wrapper.findAll("[role='radio']");

        expect(options.map((option) => option.attributes("aria-checked"))).toEqual([
            "true",
            "false",
            "false",
        ]);

        await options[1]?.trigger("click");
        expect(wrapper.emitted("update:modelValue")).toEqual([["supervised"]]);
    });
});
