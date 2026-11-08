import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";
import { describe, it } from "vitest";
import namedDefaultExport from "./namedDefaultExport.ts";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({ languageOptions: { parser: tseslint.parser } });

ruleTester.run("named-default-export", namedDefaultExport, {
    valid: [
        "const teardown = () => {};\nexport default teardown;",
        "export default function prepareNuxt() {}",
        "export default class Store {}",
        // A call names its result through the callee, as Nitro handlers and configs do.
        "export default defineEventHandler(() => 1);",
        // Config files export literals by convention.
        "export default { extends: [] };",
        "export default [];",
    ],
    invalid: [
        { code: "export default () => {};", errors: [{ messageId: "function" }] },
        { code: "export default async (event) => event;", errors: [{ messageId: "function" }] },
        { code: "export default function () {}", errors: [{ messageId: "function" }] },
        { code: "export default (function () {});", errors: [{ messageId: "function" }] },
        { code: "export default class {}", errors: [{ messageId: "class" }] },
        { code: "export default (class {});", errors: [{ messageId: "class" }] },
    ],
});

const vueTester = new RuleTester({
    languageOptions: { parser: vueParser, parserOptions: { parser: tseslint.parser } },
});

vueTester.run("named-default-export in .vue", namedDefaultExport, {
    valid: [{ code: "<script>\nexport default { name: 'X' };\n</script>", filename: "x.vue" }],
    invalid: [
        {
            code: "<script>\nexport default () => {};\n</script>",
            filename: "x.vue",
            errors: [{ messageId: "function" }],
        },
    ],
});
