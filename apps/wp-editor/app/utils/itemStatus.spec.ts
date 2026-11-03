import { describe, expect, it } from "vitest";
import type { ItemState } from "#shared/types.ts";
import { itemBadge, matchesFilter } from "./itemStatus.ts";

const item = (state: Partial<ItemState>, proposal = true) => ({
    proposal: proposal ? { content: "b" } : null,
    state: { level: "unreviewed" as const, ...state },
});

describe("item status", () => {
    it("shows drift over every other state, since it blocks the apply", () => {
        expect(itemBadge(item({ level: "confirmed", drift: true })).label).toBe("drift");
    });

    it("keeps applied items out of the review-level filters", () => {
        const applied = item({ level: "confirmed", applied: { at: "", modifiedGmt: "" } });

        expect(matchesFilter(applied, "confirmed")).toBe(false);
        expect(matchesFilter(applied, "applied")).toBe(true);
    });

    it("stops counting a restored item as applied", () => {
        const restored = item({
            applied: { at: "", modifiedGmt: "" },
            restored: { at: "", modifiedGmt: "" },
        });

        expect(matchesFilter(restored, "applied")).toBe(false);
        expect(itemBadge(restored).label).toBe("unreviewed · restored");
    });
});
