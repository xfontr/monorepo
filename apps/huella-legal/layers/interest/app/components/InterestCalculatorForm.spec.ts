import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeAll, describe, expect, it } from "vitest";
import InterestCalculatorForm from "./InterestCalculatorForm.vue";

const MESSAGES = {
    formErrorSummary: { item: "{field}: {message}", title: "one | {count} errors" },
    interestCalculator: {
        customPercent: { hint: "custom-hint", label: "custom" },
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
        submit: "submit",
        to: { label: "to" },
    },
};

const mountForm = async () => {
    const wrapper = await mountSuspended(InterestCalculatorForm);
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

    return { wrapper, principal, from, to, fillYear, submit };
};

describe("interest calculator form", () => {
    beforeAll(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    it("emits the legal preset's rate, so the caller never resolves a rate name", async () => {
        const { wrapper, fillYear, submit } = await mountForm();

        await fillYear();
        await submit();

        expect(wrapper.emitted("submit")).toEqual([
            [{ principal: 1000, ratePercent: 3.25, from: "2026-01-01", to: "2027-01-01" }],
        ]);
    });

    it("prints each preset's percentage in the locale's decimal format", async () => {
        const { wrapper } = await mountForm();

        expect(wrapper.text()).toContain("legal 3,25");
        expect(wrapper.text()).toContain("judicial 5,25");
    });

    it("emits the rate typed in once the custom option is chosen", async () => {
        const { wrapper, fillYear, submit } = await mountForm();

        await fillYear();
        await wrapper.findAll("[role=radio]").at(-1)?.trigger("click");
        await flushPromises();
        await wrapper.findAll("input[type=number]").at(1)?.setValue("4");
        await submit();

        expect(wrapper.emitted("submit")?.[0]?.[0]).toMatchObject({ ratePercent: 4 });
    });

    it("withholds the submit and names the empty principal", async () => {
        const { wrapper, submit } = await mountForm();

        await submit();

        expect(wrapper.emitted("submit")).toBeUndefined();
        expect(wrapper.text()).toContain("principal-error");
    });

    it("announces a failed submit in an alert linking each invalid field", async () => {
        const { wrapper, submit } = await mountForm();

        await submit();

        const alert = wrapper.find("[role=alert]");
        const principalId = wrapper.find("input[type=number]").attributes("id");

        expect(alert.text()).toContain("3 errors");
        expect(alert.text()).toContain("principal: principal-error");
        expect(alert.find(`a[href="#${principalId}"]`).exists()).toBe(true);
    });

    it("drops the alert once the form submits cleanly", async () => {
        const { wrapper, fillYear, submit } = await mountForm();

        await submit();
        await fillYear();
        await submit();

        expect(wrapper.find("[role=alert]").exists()).toBe(false);
    });

    it("rejects an end date before the start instead of emitting negative days", async () => {
        const { wrapper, principal, from, to, submit } = await mountForm();

        await principal.setValue("1000");
        await from?.setValue("2026-02-01");
        await to?.setValue("2026-01-01");
        await submit();

        expect(wrapper.emitted("submit")).toBeUndefined();
        expect(wrapper.text()).toContain("order-error");
    });

    it("emits an edit on any input change, so the caller can drop a stale result", async () => {
        const { wrapper, principal } = await mountForm();

        await principal.setValue("2000");

        expect(wrapper.emitted("edit")).toBeDefined();
    });
});
