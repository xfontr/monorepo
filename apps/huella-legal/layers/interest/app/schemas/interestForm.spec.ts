import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { interestFormSchema } from "./interestForm";

const schema = interestFormSchema((issue) => issue);

const VALID = { principal: "1000", rate: "legal", from: "2026-01-01", to: "2026-06-01" };

const issuesOf = (input: Record<string, unknown>) =>
    v.safeParse(schema, input).issues?.map(({ message }) => message);

describe("interest form schema", () => {
    it("accepts the judicial preset", () => {
        expect(v.parse(schema, { ...VALID, rate: "judicial" })).toEqual({
            ...VALID,
            principal: 1000,
            rate: "judicial",
        });
    });

    it("reads the principal as a Spanish reader types it, so 1.000 is a thousand euros", () => {
        expect(v.parse(schema, { ...VALID, principal: "1.000,50" }).principal).toBe(1000.5);
    });

    it.each([
        ["an empty principal", { principal: "" }, ["principal"]],
        ["a zero principal", { principal: "0" }, ["principal"]],
        ["a principal that isn't a number", { principal: "mil" }, ["principal"]],
        ["an empty start date", { from: "" }, ["from"]],
        ["an empty end date", { to: "" }, ["to"]],
        ["an end date before the start", { to: "2025-12-31" }, ["order"]],
    ])("rejects %s with the issue the caller words", (_, change, issues) => {
        expect(issuesOf({ ...VALID, ...change })).toEqual(issues);
    });

    it("refuses a custom rate, which only the advanced calculator offers", () => {
        expect(v.safeParse(schema, { ...VALID, rate: "custom" }).success).toBe(false);
    });
});
