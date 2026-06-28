import globals from "globals";
import tseslint from "typescript-eslint";
import vue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";

import { stylistic, jsonc } from "./lib";

const ignores = {
    ignores: [
        "**/dist",
        "**/coverage",
        "**/types",
        "**/*.d.ts",
        "*.config.ts",
        ".nuxt/**",
        ".output/**",
    ],
};

function createVueConfig(): object[] {
    const vueBaseRaw = vue.configs["flat/strongly-recommended"];

    const vueBase = Array.isArray(vueBaseRaw) ? vueBaseRaw : [vueBaseRaw];

    return [
        ignores,
        ...vueBase,

        {
            files: ["**/*.ts"],
            ...tseslint.configs.recommended,
        },

        {
            files: ["**/*.ts"],
            ...tseslint.configs.recommendedTypeChecked,
        },

        {
            files: ["**/*.vue"],

            languageOptions: {
                parser: vueParser,
                ecmaVersion: 2022,
                sourceType: "module",
                globals: {
                    ...globals.node,
                    ...globals.browser,
                },
                parserOptions: {
                    parser: tseslint.parser,
                    extraFileExtensions: [".vue"],
                    projectService: true,
                    tsconfigRootDir: import.meta.dirname,
                },
            },

            rules: {
                "vue/multi-word-component-names": "off",
                "vue/html-indent": "off",
            },
        },

        stylistic,
        jsonc,
    ];
}

export default createVueConfig;
