import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import vitest from "@vitest/eslint-plugin";
import { jsonc, stylistic } from "./lib/index.js";

const ignores = {
    ignores: ["**/dist", "**/coverage", "**/types", "**/*.d.ts", "*.config.ts"],
};

const base = js.configs.recommended;

const typescript = tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.ts", "*.ts"],
}));

const nodeTs = {
    files: ["**/*.ts", "*.ts"],
    languageOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        globals: { ...globals.node },
        parserOptions: {
            tsconfigRootDir: process.cwd(),
            project: ["./tsconfig.json"],
        },
    },
    rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
    },
};

const vitestConfig = {
    files: ["**/*.test.ts"],
    plugins: { vitest },
    rules: { ...vitest.configs.recommended.rules },
    languageOptions: {
        globals: { ...vitest.environments.env.globals },
    },
    settings: { vitest: { typecheck: true } },
};

function createNodeConfig(): object[] {
    return [
        ignores,
        base,
        ...typescript,
        nodeTs,
        vitestConfig,
        stylistic,
        jsonc,
    ];
}

export default createNodeConfig;
