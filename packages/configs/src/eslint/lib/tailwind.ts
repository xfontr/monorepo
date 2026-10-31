import betterTailwind from "eslint-plugin-better-tailwindcss";

const { plugins, rules } = betterTailwind.configs["recommended-error"];

const tailwind = (entryPoint: string): object => ({
    files: ["**/*.vue", "**/*.ts"],
    plugins,
    rules: {
        ...rules,
        "better-tailwindcss/enforce-consistent-line-wrapping": "off",
    },
    settings: { "better-tailwindcss": { entryPoint } },
});

export default tailwind;
