import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
    css: [fileURLToPath(new URL("./app/assets/main.css", import.meta.url))],

    ui: {
        colorMode: false,
        theme: {
            colors: ["primary", "secondary", "neutral", "error"],
        },
        experimental: {
            componentDetection: true,
        },
    },

    fonts: {
        defaults: {
            weights: [400, 500, 600, 700],
            preload: true,
        },
    },
});
