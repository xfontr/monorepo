import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { shared, vitestConfig, baseIgnores } from "./lib/index.ts";

const ignores = {
    ignores: baseIgnores,
};

const base = js.configs.recommended;

const typescript = tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.ts", "*.ts"],
}));

const createNodeConfig = (): object[] => {
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
    };

    return [ignores, base, ...typescript, nodeTs, vitestConfig, ...shared];
};

export default createNodeConfig;
