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
        },
    },
    { files: ["app/lab/**", "app/pages/lab/**"], rules: { "monorepo/no-template-call": "off" } },
];
