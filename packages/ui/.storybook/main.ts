import type { StorybookConfig } from "@storybook/vue3-vite";

const config: StorybookConfig = {
    framework: "@storybook/vue3-vite",
    stories: ["../lib/**/*.stories.ts"],
};

export default config;
