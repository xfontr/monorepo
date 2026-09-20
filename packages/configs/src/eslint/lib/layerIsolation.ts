const layerIsolation: object = {
    files: ["**/app/**/*.{ts,vue}", "**/server/**/*.ts"],
    rules: {
        "no-restricted-imports": ["error", {
            patterns: [{
                group: ["**/tools/**", "**/tools"],
                message: "app/ and server/ must not import the Node-only tools layer.",
            }],
        }],
    },
};

export default layerIsolation;
