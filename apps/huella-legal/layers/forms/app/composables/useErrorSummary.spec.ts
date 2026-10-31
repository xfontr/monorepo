import { describe, expect, it } from "vitest";
import { useErrorSummary } from "./useErrorSummary";

const label = (field: string) => `${field} label`;

describe("useErrorSummary", () => {
    it("labels each field and keeps its input id, so every row links to its field", () => {
        const { errors, list } = useErrorSummary(label);

        list([{ id: "v-1", name: "email", message: "invalid value" }]);

        expect(errors.value).toEqual([
            { id: "v-1", label: "email label", message: "invalid value" },
        ]);
    });

    // A row without an input id would render a link to nowhere
    it("leaves out errors with no field or no input to link to", () => {
        const { errors, list } = useErrorSummary(label);

        list([
            { name: "email", message: "no id" },
            { id: "v-2", message: "no name" },
        ]);

        expect(errors.value).toEqual([]);
    });

    it("replaces the previous rows rather than adding to them", () => {
        const { errors, list } = useErrorSummary(label);

        list([{ id: "v-1", name: "email", message: "invalid value" }]);
        list([]);

        expect(errors.value).toEqual([]);
    });
});
