import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeAll, describe, expect, it } from "vitest";
import InterestCalculator from "./InterestCalculator.vue";

const MESSAGES = {
    formErrorSummary: { item: "{field}: {message}", title: "one | {count} errors" },
    interestCalculator: {
        customPercent: { hint: "custom-hint", label: "custom" },
        disclaimer: "disclaimer",
        errors: {
            customPercent: "custom-error",
            from: "from-error",
            order: "order-error",
            principal: "principal-error",
            to: "to-error",
        },
        from: { label: "from" },
        principal: { hint: "hint", label: "principal" },
        rate: {
            label: "rate",
            options: { custom: "custom", judicial: "judicial {percent}", legal: "legal {percent}" },
        },
        result: {
            days: "day | days",
            empty: "empty",
            interest: "interest",
            label: "result",
            total: "total",
        },
        submit: "submit",
        to: { label: "to" },
    },
};

const mountCalculator = async () => {
    const wrapper = await mountSuspended(InterestCalculator);
    const principal = wrapper.find("input[type=number]");
    const [from, to] = wrapper.findAll("input[type=date]");

    const fillYear = async () => {
        await principal.setValue("1000");
        await from?.setValue("2026-01-01");
        await to?.setValue("2027-01-01");
    };

    const submit = async () => {
        await wrapper.find("form").trigger("submit");
        await flushPromises();
    };

    const result = () => wrapper.find("[role=status]").text();

    return { principal, fillYear, submit, result };
};

describe("interest calculator", () => {
    beforeAll(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    it("shows the days, the interest and the total once the form is valid", async () => {
        const { fillYear, submit, result } = await mountCalculator();

        await fillYear();
        await submit();

        expect(result()).toContain("365");
        expect(result()).toContain("32,50");
        expect(result()).toContain("1032,50");
    });

    it("withholds the result while the form is invalid", async () => {
        const { submit, result } = await mountCalculator();

        await submit();

        expect(result()).toBe("empty");
    });

    it("clears a stale result as soon as an input changes", async () => {
        const { principal, fillYear, submit, result } = await mountCalculator();

        await fillYear();
        await submit();
        await principal.setValue("2000");

        expect(result()).toBe("empty");
    });
});
