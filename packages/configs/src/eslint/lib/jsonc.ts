import jsoncPlugin from "eslint-plugin-jsonc";

const jsonc: object = {
    files: ["**/projects/*/*.json"],
    plugins: { jsonc: jsoncPlugin },
    language: "jsonc/x",
    rules: {
        "jsonc/sort-keys": "error",
    },
};

export default jsonc;
