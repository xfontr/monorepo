import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import vue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";

import { shared, vueOnly, vitestConfig, baseIgnores } from "./lib/index.ts";

const ignores = {
    ignores: [...baseIgnores, ".nuxt/**", ".output/**"],
};

// A Nuxt app's `.vue` imports resolve to error types, so the files that import components sit out
const typeCheckedTs = tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.ts", "*.ts"],
    ignores: ["**/*.spec.ts", "**/*.stories.ts", "**/.storybook/**"],
}));

const createBaseVueConfig = (typeChecked: boolean): object[] => {
    const vueBaseRaw = vue.configs["flat/strongly-recommended"];

    const vueBase = Array.isArray(vueBaseRaw) ? vueBaseRaw : [vueBaseRaw];

    const base = [
        ignores,
        js.configs.recommended,
        ...vueBase,
        ...tseslint.configs.recommended,
        ...(typeChecked ? tseslint.configs.recommendedTypeChecked : typeCheckedTs),
        // Its own `files` stop at `.ts`, yet a `<script lang="ts">` needs the same core rules off.
        { ...tseslint.configs.eslintRecommended, files: ["**/*.vue"] },
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
                    projectService: typeChecked,
                    tsconfigRootDir: process.cwd(),
                },
            },

            rules: {
                "vue/multi-word-component-names": "off",
                "vue/require-default-prop": "off",
                "vue/v-bind-style": ["error", "shorthand", { sameNameShorthand: "always" }],
                "vue/prefer-separate-static-class": "error",
                "vue/component-name-in-template-casing": [
                    "error",
                    "PascalCase",
                    { registeredComponentsOnly: false },
                ],
                "vue/no-setup-props-reactivity-loss": "error",
                "vue/block-order": ["error", { order: ["template", "script", "style"] }],
                "vue/define-macros-order": [
                    "error",
                    { order: ["defineProps", "defineEmits", "defineModel", "defineSlots"] },
                ],
            },
        },

        typeChecked
            ? vitestConfig
            : { ...vitestConfig, settings: { vitest: { typecheck: false } } },
        ...shared,
        ...vueOnly,
    ];
};

export const createVueConfig = (): object[] => createBaseVueConfig(true);

export const createNuxtConfig = (): object[] => createBaseVueConfig(false);
