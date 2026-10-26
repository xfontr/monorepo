import { mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeAll, describe, expect, it } from "vitest";
import InterestCalculatorResult from "./InterestCalculatorResult.vue";

const MESSAGES = {
    interestCalculator: {
        disclaimer: "disclaimer",
        result: {
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
});
