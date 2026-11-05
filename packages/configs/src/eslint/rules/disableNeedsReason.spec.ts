import { RuleTester } from "eslint";
import vueParser from "vue-eslint-parser";
import { describe, it } from "vitest";
import disableNeedsReason from "./disableNeedsReason.ts";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester();
const vueTester = new RuleTester({ languageOptions: { parser: vueParser } });

ruleTester.run("disable-needs-reason", disableNeedsReason, {
    valid: [
        "// eslint-disable-next-line no-console -- this CLI's output is its result\nconsole.log(1);",
        "console.log(1); // eslint-disable-line no-console -- the CLI's output",
        "/* eslint-disable no-console -- a CLI block */\nconsole.log(1);\n/* eslint-enable no-console */",
        "/* eslint-disable no-console, no-eval -- a CLI block */\nconsole.log(1);\n/* eslint-enable */",
        "// eslint-enable no-console",
        "// eslint-disabled is not a directive",
    ],
    invalid: [
        {
            code: "// eslint-disable-next-line no-console\nconsole.log(1);",
            errors: [{ messageId: "reason" }],
        },
        {
            code: "// eslint-disable-next-line -- the CLI's output\nconsole.log(1);",
            errors: [{ messageId: "unnamed" }],
        },
        {
            code: "// eslint-disable-next-line\nconsole.log(1);",
            errors: [{ messageId: "unnamed" }, { messageId: "reason" }],
        },
        {
            code: "/* eslint-disable no-console -- a CLI block */\nconsole.log(1);",
            errors: [{ messageId: "unclosed" }],
        },
        {
            code: "/* eslint-disable no-console, no-eval -- a CLI block */\nconsole.log(1);\n/* eslint-enable no-console */",
            errors: [{ messageId: "unclosed" }],
        },
        {
            code: "/* eslint-enable no-console */\n/* eslint-disable no-console -- a CLI block */",
            errors: [{ messageId: "unclosed" }],
        },
    ],
});

vueTester.run("disable-needs-reason in templates", disableNeedsReason, {
    valid: [
        {
            code: '<template><div><!-- eslint-disable-next-line vue/no-v-html -- sanitised --><p v-html="html" /></div></template>',
            filename: "x.vue",
        },
        {
            code: '<template><div><!-- eslint-disable vue/no-v-html -- sanitised --><p v-html="html" /><!-- eslint-enable vue/no-v-html --></div></template>',
            filename: "x.vue",
        },
    ],
    invalid: [
        {
            code: '<template><div><!-- eslint-disable vue/no-v-html -- sanitised --><p v-html="html" /></div></template>',
            filename: "x.vue",
            errors: [{ messageId: "unclosed" }],
        },
        {
            code: '<template><div><!-- eslint-disable-next-line vue/no-v-html --><p v-html="html" /></div></template>',
            filename: "x.vue",
            errors: [{ messageId: "reason" }],
        },
    ],
});
