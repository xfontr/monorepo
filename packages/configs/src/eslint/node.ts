import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import vitest from "@vitest/eslint-plugin";
import { jsoncConfig, stylisticConfig } from "./shared";

const ignores = {
    ignores: ["**/dist", "**/coverage", "**/types", "**/*.d.ts", "*.config.ts"],
};

const base = js.configs.recommended;

const typescript = tseslint.configs.recommendedTypeChecked;

const nodeTs = {
    files: ["**/*.ts"],
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
        stylisticConfig,
        jsoncConfig,
    ];
}

export default createNodeConfig;
