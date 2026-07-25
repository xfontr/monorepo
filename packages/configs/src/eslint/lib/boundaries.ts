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
                        sourceTag: "type:infra",
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
