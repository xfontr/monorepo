// The rule's default skips string arrays, which `sort()` orders by UTF-16 code unit, not by locale
const sortCompare: object = {
    files: ["**/*.ts", "*.ts"],
    ignores: ["**/*.spec.ts", "**/*.stories.ts", "**/.storybook/**"],
    rules: {
        "@typescript-eslint/require-array-sort-compare": ["error", { ignoreStringArrays: false }],
    },
};

export default sortCompare;
