import type { StorybookConfig } from "@storybook/vue3-vite";

const config: StorybookConfig = {
    framework: "@storybook/vue3-vite",
    stories: ["../lib/**/*.stories.ts"],
    core: {
        disableTelemetry: true,
    },
    viteFinal: (config) => ({
        ...config,
        base: process.env.STORYBOOK_BASE_URL ?? config.base,
    }),
};

export default config;
