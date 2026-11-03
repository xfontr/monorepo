import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { interestAdvancedFormSchema } from "./interestAdvancedForm";

const schema = interestAdvancedFormSchema((issue) => issue);

const VALID = {
    concept: "Pensión de marzo",
    principal: "300",
    rate: "legal",
    fromDay: 7,
    fromMonth: 3,
    fromYear: 2017,
    toDay: 1,
    toMonth: 1,
    toYear: 2026,
};

const issuesOf = (input: Record<string, unknown>) =>
    v
        .safeParse(schema, input)
        .issues?.map(({ message, path }) => [path?.map(({ key }) => key).join("."), message]);

describe("interest advanced form schema", () => {
    it("joins each date's three fields into an ISO date", () => {
        expect(v.parse(schema, VALID)).toEqual({
            concept: "Pensión de marzo",
            principal: 300,
            rate: "legal",
            from: "2017-03-07",
            to: "2026-01-01",
        });
    });

    it("trims the concept and lets it be left out", () => {
        expect(v.parse(schema, { ...VALID, concept: "  Marzo " }).concept).toBe("Marzo");
        expect(v.parse(schema, { ...VALID, concept: undefined }).concept).toBe("");
    });

    it("accepts a custom rate with decimals", () => {
        expect(
            v.parse(schema, { ...VALID, rate: "custom", customPercent: "4,0625" }),
        ).toMatchObject({
            rate: "custom",
            customPercent: 4.0625,
        });
    });

    it.each([
        ["an empty principal", { principal: "" }, [["principal", "principal"]]],
        ["a negative principal", { principal: "-5" }, [["principal", "principal"]]],
        [
            "a custom rate left empty",
            { rate: "custom", customPercent: "" },
            [["customPercent", "customPercent"]],
        ],
        [
            "a negative custom rate",
            { rate: "custom", customPercent: "-1" },
            [["customPercent", "customPercent"]],
        ],
        [
            "a custom rate over 100",
            { rate: "custom", customPercent: "101" },
            [["customPercent", "customPercent"]],
        ],
        ["31 February as the start", { fromDay: 31, fromMonth: 2 }, [["fromDay", "fromInvalid"]]],
        ["a two-digit start year", { fromYear: 17 }, [["fromDay", "fromInvalid"]]],
        ["a start day left empty", { fromDay: "" }, [["fromDay", "from"]]],
        ["an end month left empty", { toMonth: "" }, [["toDay", "to"]]],
        ["30 February as the end", { toDay: 30, toMonth: 2 }, [["toDay", "toInvalid"]]],
        ["an end before the start", { toYear: 2016 }, [["toDay", "order"]]],
    ])("rejects %s once, on the field the summary links to", (_, change, issues) => {
        expect(issuesOf({ ...VALID, ...change })).toEqual(issues);
    });

    it("reports both dates when both are empty, and no order issue on top", () => {
        const empty = {
            fromDay: "",
            fromMonth: "",
            fromYear: "",
            toDay: "",
            toMonth: "",
            toYear: "",
        };

        expect(issuesOf({ ...VALID, ...empty })).toEqual([
            ["fromDay", "from"],
            ["toDay", "to"],
        ]);
    });
});
