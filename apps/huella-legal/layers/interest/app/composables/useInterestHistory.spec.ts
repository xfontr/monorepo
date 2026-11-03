import { mountSuspended } from "@nuxt/test-utils/runtime";
import { afterEach, describe, expect, it } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import type { InterestEntry } from "../types/InterestEntry";
import { useInterestHistory } from "./useInterestHistory";

const STORAGE_KEY = "huella-legal:interest-history";

const ENTRY: Omit<InterestEntry, "id"> = {
    concept: "Marzo",
    principal: 1000,
    ratePercent: 3.25,
    from: "2026-01-01",
    to: "2027-01-01",
    days: 365,
    interestCents: 3250,
    totalCents: 103_250,
};

const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");

// The composable reads storage on mount, so it runs inside a component
const mountHistory = async () => {
    let history!: ReturnType<typeof useInterestHistory>;

    await mountSuspended(
        defineComponent({
            setup: () => {
                history = useInterestHistory();

                return () => h("div");
            },
        }),
    );
    await nextTick();

    return history;
};

afterEach(() => {
    localStorage.clear();
});

describe("useInterestHistory", () => {
    it("keeps added rows in local storage, so a reload doesn't lose them", async () => {
        const history = await mountHistory();

        history.add(ENTRY);
        await nextTick();

        expect(stored()).toEqual([{ ...ENTRY, id: expect.any(String) }]);
    });

    it("reads back what an earlier visit stored", async () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([{ ...ENTRY, id: "a" }]));

        const history = await mountHistory();

        expect(history.entries.value).toEqual([{ ...ENTRY, id: "a" }]);
    });

    it("drops a stored row of the wrong shape instead of rendering NaN", async () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify([{ ...ENTRY, id: "a" }, { id: "b", concept: "old" }, "junk"]),
        );

        const history = await mountHistory();

        expect(history.entries.value.map(({ id }) => id)).toEqual(["a"]);
    });

    it("treats stored data that isn't a list as an empty table", async () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows: [] }));

        const history = await mountHistory();

        expect(history.entries.value).toEqual([]);
    });

    it("renames, removes and clears by id without touching the other rows", async () => {
        const history = await mountHistory();

        history.add(ENTRY);
        history.add({ ...ENTRY, concept: "Abril" });

        const [first, second] = history.entries.value;

        history.rename(first!.id, "  Mayo ");

        expect(history.entries.value.map(({ concept }) => concept)).toEqual(["Mayo", "Abril"]);

        history.remove(first!.id);

        expect(history.entries.value.map(({ id }) => id)).toEqual([second!.id]);

        history.clear();

        expect(history.entries.value).toEqual([]);
    });
});
