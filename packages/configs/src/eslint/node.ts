import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { jsonc, stylistic, boundaries, vitestConfig, baseIgnores, coreIsolation } from "./lib/index.ts";

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
        },
    };

    return [
        ignores,
        base,
        ...typescript,
        nodeTs,
        vitestConfig,
        stylistic,
        jsonc,
        boundaries,
        coreIsolation,
    ];
}

export default createNodeConfig;
