import monorepo from "../rules/index.ts";

const templateCalls: object = {
    files: ["**/*.vue"],
    plugins: { monorepo },
    rules: {
        "monorepo/no-template-call": "error",
    },
};

export default templateCalls;
