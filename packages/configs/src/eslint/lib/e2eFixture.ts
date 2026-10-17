const e2eFixture: object = {
    files: ["**/e2e/**/*.spec.ts"],
    rules: {
        "no-restricted-imports": [
            "error",
            {
                paths: [
                    {
                        name: "@playwright/test",
                        importNames: ["test"],
                        message:
                            "Import `test` from @monorepo/configs/playwright/test, whose `page` fails the test on browser console output.",
                    },
                ],
            },
        ],
    },
};

export default e2eFixture;
