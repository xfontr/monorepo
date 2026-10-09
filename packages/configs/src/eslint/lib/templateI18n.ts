const templateI18n: object = {
    files: ["**/*.vue"],
    rules: {
        "vue/no-restricted-syntax": [
            "error",
            {
                selector:
                    "CallExpression[callee.type='Identifier'][callee.name=/^(t|te|tm|rt|d|n)$/]",
                message:
                    "Use the global `$t` (`$te`, `$tm`, `$rt`, `$d`, `$n`) in templates, not the `useI18n()` binding.",
            },
        ],
    },
};

export default templateI18n;
