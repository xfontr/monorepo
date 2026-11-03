import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import InterestCalculatorAdvancedForm from "./InterestCalculatorAdvancedForm.vue";

const MESSAGES = {
    formErrorSummary: { item: "{field}: {message}", title: "one | {count} errors" },
    interestCalculator: {
        advanced: { from: { legend: "from-legend" }, to: { legend: "to-legend" } },
        concept: { hint: "concept-hint", label: "concept" },
        customPercent: { hint: "custom-hint", label: "custom" },
        date: { day: "day", month: "month", year: "year" },
        errors: {
            customPercent: "custom-error",
            from: "from-error",
            fromInvalid: "from-invalid-error",
            order: "order-error",
            principal: "principal-error",
            to: "to-error",
            toInvalid: "to-invalid-error",
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

// The pensión de alimentos case the page describes: 300 EUR owed from 7 March 2017
const FILLED = {
    concept: "Marzo",
    principal: "300",
    fromDay: "7",
    fromMonth: "3",
    fromYear: "2017",
    toDay: "1",
    toMonth: "1",
    toYear: "2026",
};

const mountForm = async () => {
    const wrapper = await mountSuspended(InterestCalculatorAdvancedForm);
    const field = (name: string) => wrapper.find(`input[name=${name}]`);

    const fill = async (values: Partial<typeof FILLED> = FILLED) => {
        for (const [name, value] of Object.entries(values)) await field(name).setValue(value);
    };

    const submit = async () => {
        await wrapper.find("form").trigger("submit");
        await flushPromises();
    };

    return { wrapper, field, fill, submit };
};

describe("interest calculator advanced form", () => {
    beforeEach(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    it("joins the separate day, month and year fields into the dates it emits", async () => {
        const { wrapper, fill, submit } = await mountForm();

        await fill();
        await submit();

        expect(wrapper.emitted("submit")).toEqual([
            [
                {
                    concept: "Marzo",
                    principal: 300,
                    ratePercent: 3.25,
                    from: "2017-03-07",
                    to: "2026-01-01",
                },
            ],
        ]);
    });

    it("keeps every field after a submit, so the next month needs one edit", async () => {
        const { wrapper, field, fill, submit } = await mountForm();

        await fill();
        await submit();
        await field("fromMonth").setValue("4");
        await submit();

        expect(wrapper.emitted("submit")?.[1]?.[0]).toMatchObject({
            concept: "Marzo",
            principal: 300,
            from: "2017-04-07",
            to: "2026-01-01",
        });
    });

    it("emits the rate typed in once the custom option is chosen", async () => {
        const { wrapper, field, fill, submit } = await mountForm();

        await fill();
        await wrapper.findAll("[role=radio]").at(-1)?.trigger("click");
        await flushPromises();
        await field("customPercent").setValue("4,5");
        await submit();

        expect(wrapper.emitted("submit")?.[0]?.[0]).toMatchObject({ ratePercent: 4.5 });
    });

    it("refuses a day that doesn't exist instead of rolling it into the next month", async () => {
        const { wrapper, fill, submit } = await mountForm();

        await fill({ ...FILLED, fromDay: "31", fromMonth: "2" });
        await submit();

        expect(wrapper.emitted("submit")).toBeUndefined();
        expect(wrapper.text()).toContain("from-invalid-error");
    });

    it("marks all three parts of a date invalid, not only the day the issue sits on", async () => {
        const { field, fill, submit } = await mountForm();

        await fill({ ...FILLED, fromYear: "17" });
        await submit();

        for (const part of ["fromDay", "fromMonth", "fromYear"]) {
            expect(field(part).attributes("aria-invalid")).toBe("true");
        }
        expect(field("toDay").attributes("aria-invalid")).not.toBe("true");
    });

    it("tells an incomplete date apart from one that doesn't exist", async () => {
        const { wrapper, fill, submit } = await mountForm();

        await fill({ ...FILLED, fromYear: "" });
        await submit();

        expect(wrapper.text()).toContain("from-error");
        expect(wrapper.text()).not.toContain("from-invalid-error");
    });

    it("drops a date from the alert once its year is fixed, without another submit", async () => {
        const { wrapper, field, fill, submit } = await mountForm();

        await fill({ ...FILLED, fromYear: "17" });
        await submit();
        await field("fromYear").setValue("2017");
        await flushPromises();

        expect(wrapper.find("[role=alert]").exists()).toBe(false);
        expect(wrapper.text()).not.toContain("from-invalid-error");
    });

    it("names an invalid date once in the summary, linked to its day field", async () => {
        const { wrapper, field, fill, submit } = await mountForm();

        await fill({ ...FILLED, toDay: "", toMonth: "", toYear: "" });
        await submit();

        const alert = wrapper.get("[role=alert]");

        expect(alert.text()).toContain("to: to-error");
        expect(alert.findAll("li")).toHaveLength(1);
        expect(alert.find(`a[href="#${field("toDay").attributes("id")}"]`).exists()).toBe(true);
    });

    it("rejects an end date before the start", async () => {
        const { wrapper, fill, submit } = await mountForm();

        await fill({ ...FILLED, toYear: "2016" });
        await submit();

        expect(wrapper.emitted("submit")).toBeUndefined();
        expect(wrapper.text()).toContain("order-error");
    });

    it("emits an edit on any input change, so the caller can drop a stale result", async () => {
        const { wrapper, field } = await mountForm();

        await field("fromMonth").setValue("5");

        expect(wrapper.emitted("edit")).toBeDefined();
    });
});
