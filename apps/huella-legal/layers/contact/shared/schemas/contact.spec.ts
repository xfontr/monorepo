import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { contactSchema } from "./contact";

const schema = contactSchema((issue) => issue);

const VALID = {
    name: " Lucía Pérez ",
    email: " lucia@ejemplo.es ",
    message: " Una pregunta sobre el último número. ",
    consent: true,
};

const issues = (input: Record<string, unknown>) =>
    v.safeParse(schema, input).issues?.map((issue) => [v.getDotPath(issue), issue.message]);

describe("contact schema", () => {
    it("trims every text field, so a pasted space never fails or reaches the inbox", () => {
        expect(v.parse(schema, VALID)).toEqual({
            name: "Lucía Pérez",
            email: "lucia@ejemplo.es",
            message: "Una pregunta sobre el último número.",
            consent: true,
        });
    });

    it.each([
        ["a blank name", { name: "   " }, "name", "required"],
        ["no name at all", { name: undefined }, "name", "required"],
        ["an address with no domain", { email: "lucia@" }, "email", "invalid"],
        ["a blank address", { email: "   " }, "email", "required"],
        ["a blank message", { message: "   " }, "message", "required"],
        ["consent left unticked", { consent: false }, "consent", "required"],
        ["consent sent as a string", { consent: "true" }, "consent", "required"],
    ])("rejects %s with the issue the caller words", (_, change, field, issue) => {
        expect(issues({ ...VALID, ...change })).toEqual([[field, issue]]);
    });

    it("names every missing field at once, so the reader fixes them in one pass", () => {
        expect(issues({})?.map(([field]) => field)).toEqual([
            "name",
            "email",
            "message",
            "consent",
        ]);
    });
});
