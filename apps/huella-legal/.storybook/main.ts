import ui from "@nuxt/ui/vite";
import type { StorybookConfig } from "@storybook/vue3-vite";
import vue from "@vitejs/plugin-vue";
import { fontless } from "fontless";

const identity = <T>(config: T): T => config;

Object.assign(globalThis, { defineAppConfig: identity, defineNuxtConfig: identity });

const { default: appConfig } = await import("../app/app.config.ts");
const { default: nuxtConfig } = await import("../nuxt.config.ts");

const config: StorybookConfig = {
    framework: "@storybook/vue3-vite",
    stories: ["../{app,layers/*/app}/**/*.stories.ts"],
    core: {
        disableTelemetry: true,
    },
    viteFinal: (config) => ({
        ...config,
        plugins: [
            ...config.plugins ?? [],
            vue(),
            ui({
                ...nuxtConfig.ui,
                ui: appConfig.ui,
                router: false,
                dts: false,
                autoImport: { imports: ["vue"] },
            }),
            fontless(nuxtConfig.fonts || undefined),
        ],
    }),
};

export default config;
