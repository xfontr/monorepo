import formatPlugin from "eslint-plugin-format";
import vuePlugin from "eslint-plugin-vue";
import type { Rule } from "eslint";

const prettierOptions = {
    printWidth: 100,
    tabWidth: 4,
    semi: true,
    singleQuote: false,
    trailingComma: "all",
    arrowParens: "always",
};

const vueRules = vuePlugin.rules as Record<string, Rule.RuleModule>;

// Only the preset's layout rules, so one a factory opts into, like `define-macros-order`, stays on.
const vueLayoutRulesOff = Object.fromEntries(
    vuePlugin.configs["flat/strongly-recommended"]
        .flatMap((config) => Object.keys(config.rules ?? {}))
        .filter((name) => vueRules[name.replace("vue/", "")]?.meta?.type === "layout")
        .map((name) => [name, "off"]),
);

const format: object = {
    files: ["**/*.ts", "**/*.mts", "**/*.cts", "**/*.js", "**/*.mjs", "**/*.cjs"],
    plugins: { format: formatPlugin },
    rules: {
        "format/prettier": ["error", { ...prettierOptions, parser: "typescript" }],
    },
};

const formatVue: object = {
    files: ["**/*.vue"],
    plugins: { format: formatPlugin },
    rules: {
        ...vueLayoutRulesOff,
        "format/prettier": ["error", { ...prettierOptions, parser: "vue" }],
    },
};

export { format, formatVue };
