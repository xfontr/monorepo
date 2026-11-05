import monorepo from "../rules/index.ts";

const routeMeta: object = {
    files: ["**/server/api/**/*.ts", "**/server/routes/**/*.ts"],
    ignores: ["**/*.spec.ts"],
    plugins: { monorepo },
    rules: {
        "monorepo/require-route-meta": "error",
    },
};

export default routeMeta;
