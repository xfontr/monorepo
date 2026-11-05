import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";
import { describe, it } from "vitest";
import propsShape from "./propsShape.ts";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
    languageOptions: { parser: vueParser, parserOptions: { parser: tseslint.parser } },
});

const script = (body: string) => ({
    code: `<script setup lang="ts">\n${body}\n</script>`,
    filename: "x.vue",
});

const PROPS = "interface Props { label?: string }";

ruleTester.run("props-shape", propsShape, {
    valid: [
        script(`${PROPS}\nconst props = defineProps<Props>();`),
        script(`${PROPS}\nconst props = withDefaults(defineProps<Props>(), { label: "Save" });`),
        script(`${PROPS}\nconst { label = "Save" } = defineProps<Props>();`),
        // Runtime props are left alone.
        script("const props = defineProps({ label: String });"),
    ],
    invalid: [
        {
            ...script("const props = defineProps<{ label: string }>();"),
            errors: [{ messageId: "inlineType" }],
        },
        {
            ...script("interface ButtonProps { label: string }\ndefineProps<ButtonProps>();"),
            errors: [{ messageId: "name" }],
        },
        {
            ...script("type Props = { label: string };\ndefineProps<Props>();"),
            errors: [{ messageId: "typeAlias" }],
        },
        {
            ...script(`${PROPS}\nwithDefaults(defineProps<Props>(), { label: undefined });`),
            errors: [{ messageId: "undefinedDefault" }],
        },
        {
            ...script(`${PROPS}\nconst { label = undefined } = defineProps<Props>();`),
            errors: [{ messageId: "undefinedDefault" }],
        },
    ],
});
