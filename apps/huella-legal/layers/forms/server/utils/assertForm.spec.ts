import * as v from "valibot";
import { describe, expect, it, vi } from "vitest";

vi.stubGlobal("createError", (input: Record<string, unknown>) =>
    Object.assign(new Error("http"), input),
);

const { assertForm } = await import("./assertForm");

const schema = v.object({
    author: v.object({ name: v.pipe(v.string("required"), v.trim(), v.nonEmpty("required")) }),
});

describe("assertForm", () => {
    it("returns the schema's output, not the raw input", () => {
        expect(assertForm(schema, { author: { name: " Lucía " } })).toEqual({
            author: { name: "Lucía" },
        });
    });

    it("answers 422 naming each issue by its dot path, so `UForm` can place it on a nested field", () => {
        expect(() => assertForm(schema, { author: { name: "   " } })).toThrow(
            expect.objectContaining({
                statusCode: 422,
                data: [{ name: "author.name", message: "required" }],
            }),
        );
    });
});
