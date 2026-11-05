import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";
import requireRouteMeta from "./requireRouteMeta.ts";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({ languageOptions: { parser: tseslint.parser } });

const HANDLER = "export default defineEventHandler(() => 1);";
const META = 'defineRouteMeta({ openAPI: { tags: ["articles"], summary: "List articles" } });';

ruleTester.run("require-route-meta", requireRouteMeta, {
    valid: [
        `${HANDLER}\n${META}`,
        `${HANDLER}\ndefineRouteMeta({ "openAPI": { "tags": ["a"], "summary": "b", description: "c" } });`,
    ],
    invalid: [
        { code: HANDLER, errors: [{ messageId: "missing", line: 1 }] },
        {
            code: `${HANDLER}\ndefineRouteMeta({ openAPI: { tags: ["articles"] } });`,
            errors: [{ messageId: "incomplete" }],
        },
        {
            code: `${HANDLER}\ndefineRouteMeta({ openAPI: shared });`,
            errors: [{ messageId: "incomplete" }],
        },
        { code: `${META}\n${HANDLER}`, errors: [{ messageId: "beforeHandler" }] },
        {
            code: `${HANDLER}\nconst register = () => { ${META} };`,
            errors: [{ messageId: "missing" }],
        },
    ],
});
