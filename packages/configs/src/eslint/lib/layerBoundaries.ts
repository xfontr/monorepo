import monorepo from "../rules/index.ts";

const layerBoundaries = (options: { cores: string[] }): object => ({
    files: ["**/layers/**/*.ts", "**/layers/**/*.vue"],
    plugins: { monorepo },
    rules: {
        "monorepo/layer-boundaries": ["error", options],
    },
});

export default layerBoundaries;
