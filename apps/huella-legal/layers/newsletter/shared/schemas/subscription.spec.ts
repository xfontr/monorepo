import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { subscriptionSchema } from "./subscription";

const schema = subscriptionSchema((issue) => issue);

describe("subscription schema", () => {
    it("trims the address before checking it, so a pasted space never fails or reaches the provider", () => {
        expect(v.parse(schema, { email: " lucia@ejemplo.es " })).toEqual({ email: "lucia@ejemplo.es" });
    });

    it.each([
        ["an empty address", "", "required"],
        ["a blank address", "   ", "required"],
        ["an address with no domain", "lucia@", "invalid"],
    ])("rejects %s with the issue the caller words", (_, email, issue) => {
        const result = v.safeParse(schema, { email });

        expect(result.issues?.map(({ message }) => message)).toEqual([issue]);
    });
});
