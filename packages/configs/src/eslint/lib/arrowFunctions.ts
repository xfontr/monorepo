import preferArrowFunctions from "eslint-plugin-prefer-arrow-functions";

const arrowFunctions: object = {
    files: ["**/*.ts", "**/*.mts", "**/*.cts", "**/*.js", "**/*.mjs", "**/*.cjs", "**/*.vue"],
    plugins: { "prefer-arrow-functions": preferArrowFunctions },
    rules: {
        "prefer-arrow-functions/prefer-arrow-functions": ["error", { returnStyle: "unchanged" }],
        "prefer-arrow-callback": "error",
    },
};

export default arrowFunctions;
