const destructuring: object = {
    files: ["**/*.ts", "**/*.mts", "**/*.cts", "**/*.js", "**/*.mjs", "**/*.cjs", "**/*.vue"],
    rules: {
        "prefer-destructuring": [
            "error",
            {
                VariableDeclarator: { object: true, array: false },
                AssignmentExpression: { object: false, array: false },
            },
        ],
    },
};

export default destructuring;
