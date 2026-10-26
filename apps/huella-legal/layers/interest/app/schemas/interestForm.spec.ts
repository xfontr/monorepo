import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { interestFormSchema } from "./interestForm";

const schema = interestFormSchema((issue) => issue);

const VALID = { principal: 1000, rate: "legal", from: "2026-01-01", to: "2026-06-01" };

const issuesOf = (input: Record<string, unknown>) =>
    v.safeParse(schema, input).issues?.map(({ message }) => message);

describe("interest form schema", () => {
    it("drops a leftover custom rate once a preset is chosen", () => {
        expect(v.parse(schema, { ...VALID, customPercent: "" })).toEqual(VALID);
    });

    it.each([
        ["an empty principal", { principal: "" }, ["principal"]],
        ["a zero principal", { principal: 0 }, ["principal"]],
        ["an empty start date", { from: "" }, ["from"]],
        ["an empty end date", { to: "" }, ["to"]],
        ["an end date before the start", { to: "2025-12-31" }, ["order"]],
        ["a custom rate left empty", { rate: "custom", customPercent: "" }, ["customPercent"]],
        ["a custom rate of zero", { rate: "custom", customPercent: 0 }, ["customPercent"]],
        ["a custom rate over 100", { rate: "custom", customPercent: 101 }, ["customPercent"]],
    ])("rejects %s with the issue the caller words", (_, change, issues) => {
        expect(issuesOf({ ...VALID, ...change })).toEqual(issues);
    });

    it("accepts a custom rate with decimals", () => {
        expect(v.parse(schema, { ...VALID, rate: "custom", customPercent: 4.0625 })).toMatchObject({
            rate: "custom",
            customPercent: 4.0625,
        });
    });
});
