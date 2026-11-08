import monorepo from "../rules/index.ts";

const rules = { "monorepo/named-default-export": "error" };

const defaultExports: object = {
    files: ["**/*.ts", "**/*.mts", "**/*.cts", "**/*.js", "**/*.mjs", "**/*.cjs"],
    plugins: { monorepo },
    rules,
};

const defaultExportsVue: object = {
    files: ["**/*.vue"],
    plugins: { monorepo },
    rules,
};

export { defaultExports, defaultExportsVue };
