import { describe, expect, it } from "vitest";
import {
    calculateInterest,
    calendarDate,
    daysBetween,
    INTEREST_RATES,
    parseDecimal,
} from "./interest";

describe("calendarDate", () => {
    it("pads the day and month, so the result compares as a string", () => {
        expect(calendarDate(7, 3, 2017)).toBe("2017-03-07");
    });

    it("accepts 29 February in a leap year", () => {
        expect(calendarDate(29, 2, 2024)).toBe("2024-02-29");
    });

    it.each([
        ["31 February, which Date would roll into March", 31, 2, 2026],
        ["29 February outside a leap year", 29, 2, 2026],
        ["a thirteenth month", 1, 13, 2026],
        ["day zero", 0, 1, 2026],
        ["a negative day", -1, 1, 2026],
        ["a fractional day", 1.5, 1, 2026],
        ["an empty field", Number.NaN, 1, 2026],
        ["a two-digit year", 1, 1, 26],
        ["a year past 2100", 1, 1, 2101],
    ])("refuses %s", (_, day, month, year) => {
        expect(calendarDate(day, month, year)).toBeUndefined();
    });
});

describe("parseDecimal", () => {
    it.each([
        ["1.000", 1000],
        ["1.000,50", 1000.5],
        ["12.345.678", 12_345_678],
        ["1000,50", 1000.5],
        ["1000.50", 1000.5],
        ["1.5", 1.5],
        ["1 000,50 €", 1000.5],
        ["1\u00a0000", 1000],
    ])("reads %s as a Spanish amount, never as a smaller number", (text, amount) => {
        expect(parseDecimal(text, { grouping: true })).toBe(amount);
    });

    it.each([
        ["4,5", 4.5],
        ["4.125", 4.125],
        ["3,25 %", 3.25],
    ])("reads %s as a rate, where a dot is always a decimal point", (text, rate) => {
        expect(parseDecimal(text, { grouping: false })).toBe(rate);
    });

    it.each(["", "abc", "1,000.50", "1.00,5", "1,2,3", "-5", "1e3", "12.34.5"])(
        "refuses %j instead of guessing which number was meant",
        (text) => {
            expect(parseDecimal(text, { grouping: true })).toBeUndefined();
        },
    );
});

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
