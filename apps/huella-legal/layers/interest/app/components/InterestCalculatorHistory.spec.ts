import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { InterestEntry } from "../types/InterestEntry";
import InterestCalculatorHistory from "./InterestCalculatorHistory.vue";

const toast = vi.hoisted(() => ({ add: vi.fn() }));

mockNuxtImport("useToast", () => () => toast);

const MESSAGES = {
    interestCalculator: {
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
            empty: "empty",
            lead: "lead",
            remove: "remove {row}",
            title: "history",
            totals: "totals",
        },
    },
};

const ENTRIES: InterestEntry[] = [
    {
        id: "a",
        concept: "Marzo",
        principal: 1000,
        ratePercent: 3.25,
        from: "2026-01-01",
        to: "2027-01-01",
        days: 365,
        interestCents: 3250,
        totalCents: 103_250,
    },
    {
        id: "b",
        concept: "Abril",
        principal: 0.1 + 0.2,
        ratePercent: 5.25,
        from: "2026-03-07",
        to: "2026-03-07",
        days: 0,
        interestCents: 0,
        totalCents: 30,
    },
];

const clipboard = { write: vi.fn() };

class ClipboardItem {
    constructor(readonly items: Record<string, string>) {}
}

beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", { value: clipboard, configurable: true });
    vi.stubGlobal("ClipboardItem", ClipboardItem);
});

afterEach(() => {
    Reflect.deleteProperty(navigator, "clipboard");
    vi.unstubAllGlobals();
});

const mountHistory = (entries: InterestEntry[] = ENTRIES) =>
    mountSuspended(InterestCalculatorHistory, { props: { entries } });

describe("interest calculator history", () => {
    beforeEach(() => {
        useNuxtApp().$i18n.mergeLocaleMessage("es-ES", MESSAGES);
    });

    it("explains how to fill an empty table instead of drawing an empty grid", async () => {
        const wrapper = await mountHistory([]);

        expect(wrapper.find("table").exists()).toBe(false);
        expect(wrapper.text()).toContain("empty");
    });

    it("prints each row's amounts, dates and rate in the locale's format", async () => {
        const wrapper = await mountHistory();
        const cells = wrapper
            .findAll("tbody tr")[0]!
            .findAll("td")
            .map((cell) => cell.text());

        expect(cells.slice(1, 7)).toEqual([
            "1000,00\u00a0€",
            "01/01/2026",
            "01/01/2027",
            "3,25",
            "32,50\u00a0€",
            "1032,50\u00a0€",
        ]);
    });

    it("sums the principal, interest and total in cents, so float noise never reaches the footer", async () => {
        const wrapper = await mountHistory();
        const footer = wrapper
            .get("tfoot")
            .findAll("td")
            .map((cell) => cell.text());

        expect(footer.filter(Boolean)).toEqual([
            "1000,30\u00a0€",
            "32,50\u00a0€",
            "1032,80\u00a0€",
        ]);
    });

    it("emits a renamed concept once the field is committed", async () => {
        const wrapper = await mountHistory();
        const concept = wrapper.get("tbody input");

        // setValue fires input and then change, which is what committing the field does
        await concept.setValue("Mayo");

        expect(wrapper.emitted("rename")).toEqual([["a", "Mayo"]]);
    });

    it("names each row's controls by its position, so two rows never share a label", async () => {
        const wrapper = await mountHistory();

        expect(
            wrapper.findAll("tbody input").map((input) => input.attributes("aria-label")),
        ).toEqual(["concept 1", "concept 2"]);
        expect(
            wrapper.findAll("tbody button").map((button) => button.attributes("aria-label")),
        ).toEqual(["remove 1", "remove 2"]);
    });

    it("emits the removed row's id", async () => {
        const wrapper = await mountHistory();

        await wrapper.findAll("tbody button")[1]!.trigger("click");

        expect(wrapper.emitted("remove")).toEqual([["b"]]);
    });

    it("asks for a second press before clearing, since the rows can't come back", async () => {
        const wrapper = await mountHistory();
        const clear = () =>
            wrapper.findAll("button").find((button) => /clear|confirm/.test(button.text()))!;

        await clear().trigger("click");

        expect(wrapper.emitted("clear")).toBeUndefined();
        expect(clear().text()).toBe("confirm");

        await clear().trigger("click");

        expect(wrapper.emitted("clear")).toHaveLength(1);
    });

    it("drops the pending clear when focus leaves, so a later press starts over", async () => {
        const wrapper = await mountHistory();
        const clear = () =>
            wrapper.findAll("button").find((button) => /clear|confirm/.test(button.text()))!;

        await clear().trigger("click");
        await clear().trigger("blur");
        await clear().trigger("click");

        expect(wrapper.emitted("clear")).toBeUndefined();
    });

    it("copies the table as tab-separated rows of plain numbers, totals included", async () => {
        const wrapper = await mountHistory();

        await wrapper
            .findAll("button")
            .find((button) => button.text() === "copy")!
            .trigger("click");

        expect(clipboard.write).toHaveBeenCalledWith([
            new ClipboardItem({
                "text/plain": [
                    "concept\tprincipal\tfrom\tto\trate\tinterest\ttotal",
                    "Marzo\t1000,00\t01/01/2026\t01/01/2027\t3,25\t32,50\t1032,50",
                    "Abril\t0,30\t07/03/2026\t07/03/2026\t5,25\t0,00\t0,30",
                    "totals\t1000,30\t\t\t\t32,50\t1032,80",
                ].join("\n"),
            }),
        ]);
        expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: "copied" }));
    });
});
