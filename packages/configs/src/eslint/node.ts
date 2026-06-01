import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import vitest from "@vitest/eslint-plugin";
import stylistic from "@stylistic/eslint-plugin";

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

export const stylisticConfig: object = {
    ...stylistic.configs.recommended,

    rules: {
        ...stylistic.configs.recommended.rules,
        "@stylistic/indent": ["error", 4],
        "@stylistic/semi": ["error", "always"],
        "@stylistic/quotes": ["error", "double"],
    },
};

function createNodeConfig(): object[] {
    return [
        ignores,
        base,
        ...typescript,
        nodeTs,
        vitestConfig,
        stylisticConfig,
    ];
}

export default createNodeConfig;
