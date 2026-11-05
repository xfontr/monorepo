import monorepo from "../rules/index.ts";

const templateI18n: object = {
    files: ["**/*.vue"],
    plugins: { monorepo },
    rules: {
        "monorepo/template-global-i18n": "error",
    },
};

export default templateI18n;
