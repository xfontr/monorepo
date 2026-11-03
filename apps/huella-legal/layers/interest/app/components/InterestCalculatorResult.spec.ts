import { mountSuspended } from "@nuxt/test-utils/runtime";
import { nextTick } from "vue";
import { beforeAll, describe, expect, it } from "vitest";
import InterestCalculatorResult from "./InterestCalculatorResult.vue";

const RESULT = { days: 365, interestCents: 3250, totalCents: 103_250 };

const MESSAGES = {
    interestCalculator: {
        disclaimer: "disclaimer",
        result: {
            add: "add",
            added: "added",
            days: "day | days",
            empty: "empty",
            interest: "interest",
            label: "result",
            total: "total",
        },
    },
};

describe("interest calculator result", () => {
    beforeAll(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    it("prints the cents as euros in the locale's format", async () => {
        const wrapper = await mountSuspended(InterestCalculatorResult, {
            props: { result: { days: 365, interestCents: 3250, totalCents: 103_250 } },
        });
        const status = wrapper.find("[role=status]").text();

        expect(status).toContain("365");
        expect(status).toContain("32,50");
        expect(status).toContain("1032,50");
    });

    it("keeps the live region mounted while empty, so the first result is announced", async () => {
        const wrapper = await mountSuspended(InterestCalculatorResult);

        expect(wrapper.find("[role=status]").text()).toBe("empty");
    });

    it("offers to add a result to the table, and nothing to add while empty", async () => {
        const empty = await mountSuspended(InterestCalculatorResult);
        const filled = await mountSuspended(InterestCalculatorResult, {
            props: { result: RESULT },
        });

        expect(empty.find("button").exists()).toBe(false);

        await filled.get("button").trigger("click");

        expect(filled.emitted("add")).toHaveLength(1);
    });

    it("swaps the button for a focused confirmation once added, so focus never drops", async () => {
        const wrapper = await mountSuspended(InterestCalculatorResult, {
            props: { result: RESULT },
            attachTo: document.body,
        });

        await wrapper.setProps({ added: true });
        await nextTick();

        expect(wrapper.find("button").exists()).toBe(false);
        expect(document.activeElement?.textContent?.trim()).toBe("added");

        wrapper.unmount();
    });
});
