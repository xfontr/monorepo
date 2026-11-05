import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";
import lookupTableShape from "./lookupTableShape.ts";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({ languageOptions: { parser: tseslint.parser } });

ruleTester.run("lookup-table-shape", lookupTableShape, {
    valid: [
        "const LABELS = { draft: 1, live: 2 } as const satisfies Record<Status, number>;",
        "export const LABELS = { draft: 1 } as const satisfies Record<Status, number>;",
        // Keys nobody can list are left alone.
        "const cache: Record<string, number> = {};",
        "const byId: Partial<Record<number, User>> = {};",
        "const build = () => { const local: Record<Status, number> = { draft: 1 }; };",
    ],
    invalid: [
        {
            code: "const LABELS: Record<Status, number> = { draft: 1, live: 2 };",
            errors: [{ messageId: "annotated" }],
        },
        {
            code: "export const LABELS: Record<Status, number> = { draft: 1, live: 2 };",
            errors: [{ messageId: "annotated" }],
        },
        {
            code: "const LABELS: Partial<Record<Status, number>> = { draft: 1 };",
            errors: [{ messageId: "partial" }],
        },
        {
            code: "const LABELS = { draft: 1 } satisfies Record<Status, number>;",
            errors: [{ messageId: "asConst" }],
        },
        {
            code: "const labels = { draft: 1 } as const satisfies Record<Status, number>;",
            errors: [{ messageId: "name" }],
        },
    ],
});
