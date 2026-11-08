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

    icon: {
        clientBundle: {
            icons: [
                "lucide:share",
                "lucide:printer",
                "lucide:eraser",
                "lucide:trash-2",
                "lucide:reply",
                "lucide:badge-check",
                "lucide:file-text",
                "lucide:book-open",
                "lucide:gavel",
                "lucide:graduation-cap",
                "lucide:heart-handshake",
                "lucide:landmark",
                "lucide:library",
                "lucide:lock-open",
                "lucide:pen-line",
                "lucide:quote",
                "lucide:scale",
                "lucide:shield-check",
            ],
        },
    },

    fonts: {
        defaults: {
            weights: [400, 500, 600, 700],
            subsets: ["latin", "latin-ext"],
            preload: true,
        },
    },
});
