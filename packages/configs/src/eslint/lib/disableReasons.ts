import monorepo from "../rules/index.ts";

const linterOptions = { reportUnusedDisableDirectives: "error" };

const rules = { "monorepo/disable-needs-reason": "error" };

const disableReasons: object = {
    files: ["**/*.ts", "**/*.mts", "**/*.cts", "**/*.js", "**/*.mjs", "**/*.cjs"],
    plugins: { monorepo },
    linterOptions,
    rules,
};

const disableReasonsVue: object = {
    files: ["**/*.vue"],
    plugins: { monorepo },
    linterOptions,
    rules,
};

export { disableReasons, disableReasonsVue };
