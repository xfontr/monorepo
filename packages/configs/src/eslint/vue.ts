import globals from "globals";
import tseslint from "typescript-eslint";
import vue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";

import { stylistic, jsonc } from "./lib/index.js";

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

function createVueConfig(isNuxt?: boolean): object[] {
    const vueBaseRaw = vue.configs["flat/strongly-recommended"];

    const vueBase = Array.isArray(vueBaseRaw) ? vueBaseRaw : [vueBaseRaw];

    let base = [ignores, ...vueBase, ...tseslint.configs.recommended];

    // FIXME: This is an antipattern and we'd prefer nuxt to be a separate export
    if (!isNuxt) {
        base = [...base, ...tseslint.configs.recommendedTypeChecked];
    }

    return [
        ...base,
        {
            files: ["**/*.ts", "*.ts"],
            languageOptions: {
                parser: tseslint.parser,

                parserOptions: {
                    projectService: true,
                    tsconfigRootDir: import.meta.dirname,
                },
            },
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
