import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { interestEntrySchema } from "./interestEntry";

const ENTRY = {
    id: "a",
    concept: "Marzo",
    principal: 1000,
    ratePercent: 3.25,
    from: "2026-01-01",
    to: "2027-01-01",
    days: 365,
    interestCents: 3250,
    totalCents: 103_250,
};

describe("interest entry schema", () => {
    it("accepts a row as the history writes it", () => {
        expect(v.is(interestEntrySchema, ENTRY)).toBe(true);
    });

    it.each([
        ["a date the table can't format", { from: "01/01/2026" }],
        ["an amount stored as text", { principal: "1000" }],
        ["a row with no id, which rename and remove can't reach", { id: undefined }],
        ["a row from before the totals were kept", { totalCents: undefined }],
    ])("refuses %s", (_, change) => {
        expect(v.is(interestEntrySchema, { ...ENTRY, ...change })).toBe(false);
    });
});
