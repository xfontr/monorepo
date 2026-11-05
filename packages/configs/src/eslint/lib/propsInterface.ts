import monorepo from "../rules/index.ts";

const propsInterface: object = {
    files: ["**/*.vue"],
    plugins: { monorepo },
    rules: {
        "monorepo/props-shape": "error",
    },
};

export default propsInterface;
