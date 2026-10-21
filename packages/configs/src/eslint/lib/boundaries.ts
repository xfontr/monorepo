import nx from "@nx/eslint-plugin";

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
                            "type:integration",
                            "type:observability",
                            "type:ui",
                            "type:config",
                        ],
                    },
                    { sourceTag: "type:integration", onlyDependOnLibsWithTags: ["type:config"] },
                    { sourceTag: "type:observability", onlyDependOnLibsWithTags: ["type:config"] },
                    { sourceTag: "type:ui", onlyDependOnLibsWithTags: ["type:ui", "type:config"] },
                    { sourceTag: "type:infra", onlyDependOnLibsWithTags: ["type:config"] },
                    { sourceTag: "type:tooling", onlyDependOnLibsWithTags: ["type:config"] },
                    { sourceTag: "type:config", onlyDependOnLibsWithTags: [] },
                    { sourceTag: "scope:shared", onlyDependOnLibsWithTags: ["scope:shared"] },
                    {
                        sourceTag: "scope:huella-legal",
                        onlyDependOnLibsWithTags: ["scope:huella-legal", "scope:shared"],
                    },
                    {
                        sourceTag: "scope:internal",
                        onlyDependOnLibsWithTags: ["scope:internal", "scope:shared"],
                    },
                    {
                        sourceTag: "scope:tooling",
                        onlyDependOnLibsWithTags: ["scope:tooling", "scope:shared"],
                    },
                    {
                        sourceTag: "scope:infra",
                        onlyDependOnLibsWithTags: ["scope:infra", "scope:shared"],
                    },
                ],
            },
        ],
    },
};

export default boundaries;
