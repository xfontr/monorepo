import globals from "globals";
import tseslint from "typescript-eslint";
import vue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";

import { stylistic, jsonc, boundaries, vitestConfig, baseIgnores } from "./lib/index.ts";

const ignores = {
    ignores: [...baseIgnores, ".nuxt/**", ".output/**"],
};

function createBaseVueConfig(typeChecked?: boolean): object[] {
    const vueBaseRaw = vue.configs["flat/strongly-recommended"];

    const vueBase = Array.isArray(vueBaseRaw) ? vueBaseRaw : [vueBaseRaw];

    const base = [
        ignores,
        ...vueBase,
        ...tseslint.configs.recommended,
        ...(typeChecked ? tseslint.configs.recommendedTypeChecked : []),
    ];

    return [
        ...base,
        {
            files: ["**/*.ts", "*.ts"],
            languageOptions: {
                parser: tseslint.parser,

                parserOptions: {
                    projectService: true,
                    tsconfigRootDir: process.cwd(),
                },
            },
            rules: {
                "@typescript-eslint/explicit-function-return-type": "off",
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
                    tsconfigRootDir: process.cwd(),
                },
            },

            rules: {
                "vue/multi-word-component-names": "off",
                "vue/html-indent": "off",
            },
        },

        vitestConfig,
        stylistic,
        jsonc,
        boundaries,
    ];
}

export function createVueConfig(): object[] {
    return createBaseVueConfig(true);
}

export function createNuxtConfig(): object[] {
    return createBaseVueConfig(false);
}
