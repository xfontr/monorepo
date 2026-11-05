import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";
import { describe, it } from "vitest";
import templateGlobalI18n from "./templateGlobalI18n.ts";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
    languageOptions: { parser: vueParser, parserOptions: { parser: tseslint.parser } },
});

ruleTester.run("template-global-i18n", templateGlobalI18n, {
    valid: [
        { code: '<template><p>{{ $t("title") }}</p></template>', filename: "x.vue" },
        { code: "<template><p>{{ $n(total) }}</p></template>", filename: "x.vue" },
        // `useHead` and friends still need the binding in `<script>`.
        {
            code: '<script setup lang="ts">\nconst title = t("title");\n</script>',
            filename: "x.vue",
        },
        { code: "<template><p>{{ format(total) }}</p></template>", filename: "x.vue" },
    ],
    invalid: [
        {
            code: '<template><p>{{ t("title") }}</p></template>',
            filename: "x.vue",
            errors: [{ messageId: "binding" }],
        },
        {
            code: '<template><p :title="d(date)" /></template>',
            filename: "x.vue",
            errors: [{ messageId: "binding" }],
        },
    ],
});
