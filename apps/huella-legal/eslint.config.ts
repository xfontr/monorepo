import { eslint } from "@monorepo/configs";

export default [
    ...eslint.createNuxtConfig(),
    eslint.routeMeta,
    eslint.tailwind("layers/design/app/assets/main.css"),
    {
        // Plain CSS classes from the prose stylesheets and a spec hook, not Tailwind utilities.
        rules: {
            "better-tailwindcss/no-unknown-classes": [
                "error",
                { ignore: ["^hl-", "^error__debug$"] },
            ],
            // Each banned step is what a semantic role in main.css already resolves to
            "better-tailwindcss/no-restricted-classes": [
                "error",
                {
                    restrict: [
                        {
                            pattern:
                                "(^|:)(bg-(ivory-(50|100|200)|huella-slate-900)|text-(ivory-50|huella-teal-600|huella-ink-(500|600|700)|huella-slate-900)|(border|divide|ring)-(ivory-(200|300)|huella-slate-(300|900)))(/|$)",
                            message:
                                '"$0" repeats a role: use bg-default/muted/accented/inverted, text-inverted/secondary/dimmed/muted/default/highlighted or border-muted/default/accented/inverted.',
                        },
                        {
                            pattern: String.raw`(^|:)(text|leading|tracking)-\[`,
                            message:
                                '"$0" hard-codes a type value: add a --text-* or --tracking-* token to main.css.',
                        },
                    ],
                },
            ],
        },
    },
];
