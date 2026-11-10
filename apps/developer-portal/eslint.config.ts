import { eslint } from "@monorepo/configs";

export default [
    ...eslint.createNuxtConfig(),
    eslint.tailwind("layers/design/app/assets/main.css"),
    eslint.layerBoundaries({
        cores: ["design", "snapshot", "docs", "github"],
        kit: ["app/components/", "app/utils/"],
    }),
    {
        // The plugin is only registered for these, so a rule set outside them fails on any `.js`.
        files: ["**/*.vue", "**/*.ts"],
        rules: {
            // Plain CSS classes from main.css and the hooks a component's scoped style hangs off
            "better-tailwindcss/no-unknown-classes": [
                "error",
                {
                    ignore: [
                        "^tone-(good|warn|bad)$",
                        "^(data-table|numeric|embedded-report)$",
                        "^(skyline|tower|cell|cards|segment|is-selected|is-highlighted)$",
                    ],
                },
            ],
            "better-tailwindcss/no-restricted-classes": [
                "error",
                {
                    restrict: [
                        {
                            pattern: String.raw`^.*-\[.*\]$`,
                            message:
                                '"$0" hard-codes a value: use the scale, or add a token to main.css.',
                        },
                    ],
                },
            ],
        },
    },

    // `pnpm exec nx collect @monorepo/developer-portal` vendors Nx's graph client and Istanbul's HTML
    // report in here to be served as-is. Minified third-party output, not source — and the shared
    // `**/coverage` ignore only catches half of it. Linting the rest reports a third of a million
    // errors in files nobody in this repo wrote.
    { ignores: ["public/embed/**"] },
];
