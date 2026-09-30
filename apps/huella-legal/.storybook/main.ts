import ui from "@nuxt/ui/vite";
import type { StorybookConfig } from "@storybook/vue3-vite";
import vue from "@vitejs/plugin-vue";
import { fontless } from "fontless";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const identity = <T>(config: T): T => config;

Object.assign(globalThis, { defineAppConfig: identity, defineNuxtConfig: identity });

const { default: appConfig } = await import("../app/app.config.ts");
const { default: nuxtConfig } = await import("../nuxt.config.ts");

// Read here because a relative import of another project's file fails the Nx boundary rule
const messages = await readFile(new URL("../../../infrastructure/translations/projects/huella-legal/es-ES.json", import.meta.url), "utf8");

const config: StorybookConfig = {
    framework: "@storybook/vue3-vite",
    stories: ["../{app,layers/*/app}/**/*.stories.ts"],
    core: {
        disableTelemetry: true,
    },
    features: {
        experimentalDocgenServer: true,
    },
    viteFinal: (config) => ({
        ...config,
        base: process.env.STORYBOOK_BASE_URL ?? config.base,
        define: { ...config.define, __MESSAGES__: messages },
        plugins: [
            ...config.plugins ?? [],
            vue(),
            ui({
                ...nuxtConfig.ui,
                ui: appConfig.ui,
                router: false,
                dts: false,
                autoImport: {
                    imports: ["vue"],
                    dirs: [fileURLToPath(new URL("../app/utils", import.meta.url))],
                    vueTemplate: true,
                },
            }),
            fontless(nuxtConfig.fonts || undefined),
        ],
    }),
};

export default config;
