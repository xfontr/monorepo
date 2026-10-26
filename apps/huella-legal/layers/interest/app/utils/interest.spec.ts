import { describe, expect, it } from "vitest";
import { calculateInterest, daysBetween, INTEREST_RATES } from "./interest";

describe("daysBetween", () => {
    it("counts a leap day, so a year across 29 February is 366 days", () => {
        expect(daysBetween("2024-01-01", "2025-01-01")).toBe(366);
    });

    it("counts neither end twice, so the same date is zero days", () => {
        expect(daysBetween("2026-05-01", "2026-05-01")).toBe(0);
    });

    it("refuses an end before the start instead of returning negative interest", () => {
        expect(() => daysBetween("2026-05-02", "2026-05-01")).toThrow(RangeError);
    });

    it("refuses a string that is not a date", () => {
        expect(() => daysBetween("ayer", "2026-05-01")).toThrow(RangeError);
    });
});

describe("calculateInterest", () => {
    it.each([
        [3, 3000],
        [5.25, 5250],
    ])("applies %s %% over a 365-day year, %s cents on 1 000 EUR", (ratePercent, interestCents) => {
        expect(
            calculateInterest({
                principal: 1000,
                ratePercent,
                from: "2026-01-01",
                to: "2027-01-01",
            }),
        ).toEqual({ days: 365, interestCents, totalCents: 100_000 + interestCents });
    });

    it("divides by 365 even in a leap year, as the page it replaces did", () => {
        expect(
            calculateInterest({
                principal: 1000,
                ratePercent: 3,
                from: "2024-01-01",
                to: "2025-01-01",
            }).interestCents,
        ).toBe(3008);
    });

    it("rounds to the nearest cent rather than truncating", () => {
        const at = (to: string) =>
            calculateInterest({ principal: 100, ratePercent: 3, from: "2026-01-01", to })
                .interestCents;

        // 0.6 EUR for 73 days, 0.0082 EUR for one
        expect(at("2026-03-15")).toBe(60);
        expect(at("2026-01-02")).toBe(1);
    });

    it("keeps a principal with float noise exact to the cent", () => {
        const { totalCents } = calculateInterest({
            principal: 0.1 + 0.2,
            ratePercent: 3,
            from: "2026-01-01",
            to: "2026-01-01",
        });

        expect(totalCents).toBe(30);
    });

    it("charges nothing for a zero-day period", () => {
        expect(
            calculateInterest({
                principal: 500,
                ratePercent: 5,
                from: "2026-01-01",
                to: "2026-01-01",
            }),
        ).toEqual({ days: 0, interestCents: 0, totalCents: 50_000 });
    });

    it.each([0, -5, Number.NaN])("refuses a principal of %s", (principal) => {
        expect(() =>
            calculateInterest({ principal, ratePercent: 3, from: "2026-01-01", to: "2026-02-01" }),
        ).toThrow(RangeError);
    });

    it.each([0, -1, Number.NaN])("refuses a rate of %s", (ratePercent) => {
        expect(() =>
            calculateInterest({ principal: 1, ratePercent, from: "2026-01-01", to: "2026-02-01" }),
        ).toThrow(RangeError);
    });
});

describe("INTEREST_RATES", () => {
    it("keeps judicial interest two points above the legal rate, as LEC art. 576 sets it", () => {
        expect(INTEREST_RATES.judicial - INTEREST_RATES.legal).toBe(2);
    });
});
