import stylistic from "@stylistic/eslint-plugin";
import jsonc from "eslint-plugin-jsonc";

export const stylisticConfig: object = {
    ...stylistic.configs.recommended,
    rules: {
        ...stylistic.configs.recommended.rules,
        "@stylistic/indent": ["error", 4],
        "@stylistic/semi": ["error", "always"],
        "@stylistic/quotes": ["error", "double"],
    },
};

export const jsoncConfig: object = {
    files: ["*/locales/*.json", "*/locales/**/*.json"],
    plugins: { jsonc },
    language: "jsonc/x",
    rules: { "jsonc/sort-keys": "error" },
};
