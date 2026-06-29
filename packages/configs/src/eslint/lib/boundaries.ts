import nx from "@nx/eslint-plugin";

// Enforces DDD-style layering across the workspace via project `tags`
// (declared in each project's package.json under `nx.tags`).
//
//   type:app     apps — the composition/presentation layer
//   type:feature feature modules wiring domain + ui together
//   type:domain  framework-free domain logic (entities, use-cases)
//   type:ui      shared presentational components
//   type:i18n    shared translations
//   type:config  leaf tooling config (depends on nothing internal)
//
// Config files (*.config.ts) are ignored upstream, so importing
// @budget-forecast/configs from an eslint/vitest config never trips this.
const boundaries: object = {
    files: ["**/*.ts", "**/*.tsx", "**/*.vue", "**/*.js"],
    plugins: { "@nx": nx },
    rules: {
        "@nx/enforce-module-boundaries": [
            "error",
            {
                allow: [],
                depConstraints: [
                    {
                        sourceTag: "type:app",
                        onlyDependOnLibsWithTags: [
                            "type:feature",
                            "type:domain",
                            "type:ui",
                            "type:i18n",
                            "type:config",
                        ],
                    },
                    {
                        sourceTag: "type:feature",
                        onlyDependOnLibsWithTags: [
                            "type:domain",
                            "type:ui",
                            "type:i18n",
                            "type:config",
                        ],
                    },
                    {
                        sourceTag: "type:domain",
                        onlyDependOnLibsWithTags: ["type:domain", "type:config"],
                    },
                    {
                        sourceTag: "type:ui",
                        onlyDependOnLibsWithTags: ["type:ui", "type:config"],
                    },
                    {
                        sourceTag: "type:i18n",
                        onlyDependOnLibsWithTags: ["type:config"],
                    },
                    {
                        sourceTag: "type:config",
                        onlyDependOnLibsWithTags: [],
                    },
                ],
            },
        ],
    },
};

export default boundaries;
