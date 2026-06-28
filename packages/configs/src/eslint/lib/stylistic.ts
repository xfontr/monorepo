import stylisticPlugin from "@stylistic/eslint-plugin";

const stylistic: object = {
    ...stylisticPlugin.configs.recommended,
    rules: {
        ...stylisticPlugin.configs.recommended.rules,
        "@stylistic/indent": ["error", 4],
        "@stylistic/semi": ["error", "always"],
        "@stylistic/quotes": ["error", "double"],
        "@stylistic/arrow-parens": ["error", "always"],
    },
};

export default stylistic;
