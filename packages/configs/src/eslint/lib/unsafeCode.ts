const sink = (property: string) => ({
    property,
    message: "Writes raw HTML. Sanitize it on the server and render it with a reviewed `v-html`.",
});

// Specs build fixtures this way, and their input never comes from a reader
const unsafeCode: object = {
    ignores: ["**/*.spec.ts"],
    rules: {
        "no-eval": "error",
        "no-implied-eval": "error",
        "no-new-func": "error",
        "no-script-url": "error",
        "no-restricted-properties": [
            "error",
            sink("innerHTML"),
            sink("outerHTML"),
            sink("insertAdjacentHTML"),
            { object: "document", property: "write", message: "Writes raw HTML." },
        ],
    },
};

// `flat/strongly-recommended` doesn't include it; `recommended`, which the factories skip, does
const unsafeCodeVue: object = {
    files: ["**/*.vue"],
    rules: { "vue/no-v-html": "error" },
};

export { unsafeCode, unsafeCodeVue };
