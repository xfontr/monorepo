import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import {
    jsonc,
    format,
    boundaries,
    vitestConfig,
    baseIgnores,
    coreIsolation,
    restrictedSyntax,
    regexp,
} from "./lib/index.ts";

const ignores = {
    ignores: baseIgnores,
};

const base = js.configs.recommended;

const typescript = tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.ts", "*.ts"],
}));

function createNodeConfig(): object[] {
    const nodeTs = {
        files: ["**/*.ts", "*.ts"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: { ...globals.node },
            parserOptions: {
                projectService: true,
                tsconfigRootDir: process.cwd(),
            },
        },
        rules: {
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
        },
    };

    return [
        ignores,
        base,
        ...typescript,
        nodeTs,
        vitestConfig,
        format,
        jsonc,
        boundaries,
        coreIsolation,
        restrictedSyntax,
        regexp,
    ];
}

export default createNodeConfig;
