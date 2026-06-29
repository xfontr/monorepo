import vitest from "@vitest/eslint-plugin";

const vitestConfig = {
    files: ["**/*.spec.ts"],
    plugins: { vitest },
    rules: { ...vitest.configs.recommended.rules },
    languageOptions: {
        globals: { ...vitest.environments.env.globals },
    },
    settings: { vitest: { typecheck: true } },
};

export default vitestConfig;
