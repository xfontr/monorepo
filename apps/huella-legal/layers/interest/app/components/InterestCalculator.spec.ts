import type { VueWrapper } from "@vue/test-utils";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import InterestCalculator from "./InterestCalculator.vue";

const MESSAGES = {
    formErrorSummary: { item: "{field}: {message}", title: "one | {count} errors" },
    interestCalculator: {
        advanced: { from: { legend: "from-legend" }, to: { legend: "to-legend" } },
        concept: { hint: "concept-hint", label: "concept" },
        customPercent: { hint: "custom-hint", label: "custom" },
        date: { day: "day", month: "month", year: "year" },
        disclaimer: "disclaimer",
        errors: {
            customPercent: "custom-error",
            from: "from-error",
            order: "order-error",
            principal: "principal-error",
            to: "to-error",
        },
        from: { label: "from" },
        history: {
            clear: "clear",
            cleared: "cleared",
            columns: {
                actions: "actions",
                concept: "concept",
                from: "from",
                interest: "interest",
                principal: "principal",
                rate: "rate",
                to: "to",
                total: "total",
            },
            conceptLabel: "concept {row}",
            confirmClear: "confirm",
            copied: "copied",
            copy: "copy",
            empty: "history-empty",
            lead: "lead",
            remove: "remove {row}",
            title: "history",
            totals: "totals",
        },
        principal: { hint: "hint", label: "principal" },
        rate: {
            label: "rate",
            options: { custom: "custom", judicial: "judicial {percent}", legal: "legal {percent}" },
        },
        result: {
            add: "add",
            added: "added",
            days: "day | days",
            empty: "empty",
            interest: "interest",
            label: "result",
            total: "total",
        },
        submit: "submit",
        tabs: { advanced: "advanced", simple: "simple" },
        to: { label: "to" },
    },
};

const panel = (wrapper: VueWrapper, index: number) => wrapper.findAll("[role=tabpanel]")[index]!;

const selectTab = async (wrapper: VueWrapper, index: number) => {
    await wrapper.findAll("[role=tab]")[index]!.trigger("mousedown", { button: 0 });
    await flushPromises();
};

const submit = async (wrapper: VueWrapper, index: number) => {
    await panel(wrapper, index).find("form").trigger("submit");
    await flushPromises();
};

const fillSimple = async (wrapper: VueWrapper) => {
    const [from, to] = panel(wrapper, 0).findAll("input[type=date]");

    await panel(wrapper, 0).find("input[name=principal]").setValue("1000");
    await from?.setValue("2026-01-01");
    await to?.setValue("2027-01-01");
};

const fillAdvanced = async (wrapper: VueWrapper) => {
    const fields = {
        principal: "300",
        concept: "Marzo",
        fromDay: "1",
        fromMonth: "1",
        fromYear: "2026",
        toDay: "1",
        toMonth: "1",
        toYear: "2027",
    };

    for (const [name, value] of Object.entries(fields)) {
        await panel(wrapper, 1).find(`input[name=${name}]`).setValue(value);
    }
};

const addButton = (wrapper: VueWrapper, index: number) =>
    panel(wrapper, index)
        .findAll("button")
        .find((button) => button.text() === "add");

const result = (wrapper: VueWrapper, index: number) =>
    panel(wrapper, index).find("[role=status]").text();

afterEach(() => {
    localStorage.clear();
});

describe("interest calculator", () => {
    beforeEach(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    it("shows the days, the interest and the total once the simple form is valid", async () => {
        const wrapper = await mountSuspended(InterestCalculator);

        await fillSimple(wrapper);
        await submit(wrapper, 0);

        expect(result(wrapper, 0)).toContain("365");
        expect(result(wrapper, 0)).toContain("32,50");
        expect(result(wrapper, 0)).toContain("1032,50");
    });

    it("withholds the result while the form is invalid", async () => {
        const wrapper = await mountSuspended(InterestCalculator);

        await submit(wrapper, 0);

        expect(result(wrapper, 0)).toBe("empty");
    });

    it("clears a stale result as soon as an input changes", async () => {
        const wrapper = await mountSuspended(InterestCalculator);

        await fillSimple(wrapper);
        await submit(wrapper, 0);
        await panel(wrapper, 0).find("input[name=principal]").setValue("2000");

        expect(result(wrapper, 0)).toBe("empty");
    });

    it("keeps each tab's fields and result when switching between them", async () => {
        const wrapper = await mountSuspended(InterestCalculator);

        await fillSimple(wrapper);
        await submit(wrapper, 0);
        await selectTab(wrapper, 1);
        await selectTab(wrapper, 0);

        expect(result(wrapper, 0)).toContain("32,50");
        expect(
            (panel(wrapper, 0).find("input[name=principal]").element as HTMLInputElement).value,
        ).toBe("1000");
    });

    it("adds a result to the shared table once, with the concept typed in the advanced tab", async () => {
        const wrapper = await mountSuspended(InterestCalculator);

        await selectTab(wrapper, 1);
        await fillAdvanced(wrapper);
        await submit(wrapper, 1);
        await addButton(wrapper, 1)!.trigger("click");
        await flushPromises();

        const rows = wrapper.findAll("tbody tr");

        expect(rows).toHaveLength(1);
        expect((rows[0]!.get("input").element as HTMLInputElement).value).toBe("Marzo");
        expect(rows[0]!.text()).toContain("9,75");
        expect(addButton(wrapper, 1)).toBeUndefined();
    });

    it("adds simple and advanced results to the same table", async () => {
        const wrapper = await mountSuspended(InterestCalculator);

        await fillSimple(wrapper);
        await submit(wrapper, 0);
        await addButton(wrapper, 0)!.trigger("click");
        await selectTab(wrapper, 1);
        await fillAdvanced(wrapper);
        await submit(wrapper, 1);
        await addButton(wrapper, 1)!.trigger("click");
        await flushPromises();

        expect(wrapper.findAll("tbody tr")).toHaveLength(2);
    });
});
