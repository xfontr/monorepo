import ui from "@nuxt/ui/vite";
import type { StorybookConfig } from "@storybook/vue3-vite";
import vue from "@vitejs/plugin-vue";
import { fontless } from "fontless";
import { glob, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const identity = <T>(config: T): T => config;

Object.assign(globalThis, {
    defineAppConfig: identity,
    defineI18nConfig: identity,
    defineNuxtConfig: identity,
});

const { default: appConfig } = await import("../layers/design/app/app.config.ts");
const { default: nuxtConfig } = await import("../layers/design/nuxt.config.ts");
const { default: i18nConfig } = await import("../i18n/i18n.config.ts");

// @nuxt/fonts 1.0 types `local` as provider options, which fontless 1.3 still types as an empty record.
const fonts = { ...nuxtConfig.fonts, local: undefined };

// Read here because a relative import of another project's file fails the Nx boundary rule
const messages = await readFile(
    new URL(
        "../../../infrastructure/translations/projects/huella-legal/es-ES.json",
        import.meta.url,
    ),
    "utf8",
);

const root = fileURLToPath(new URL("..", import.meta.url));
const componentDirs = await Array.fromAsync(
    glob(["app/components", "layers/*/app/components"], { cwd: root }),
);
const utilDirs = await Array.fromAsync(
    glob(["app/utils", "layers/*/app/utils", "layers/*/shared/utils"], { cwd: root }),
    (dir) => `${root}${dir}`,
);

const titlePrefix = (dir: string) => {
    const layer = /^layers\/([^/]+)/.exec(dir)?.[1];
    return layer ? layer[0]!.toUpperCase() + layer.slice(1) : "App";
};

const config: StorybookConfig = {
    framework: {
        name: "@storybook/vue3-vite",
        // No story reads component docs, and docgen ran out of heap on the deploy runner (#330)
        options: { docgen: false },
    },
    stories: [
        ...componentDirs.toSorted().map((dir) => ({
            directory: `../${dir}`,
            files: "**/*.stories.ts",
            titlePrefix: titlePrefix(dir),
        })),
        { directory: "../app/lab", files: "**/*.stories.ts", titlePrefix: "Lab" },
    ],
    staticDirs: [{ from: "../public/favicon.ico", to: "/favicon.ico" }],
    core: {
        disableTelemetry: true,
    },
    viteFinal: (config) => ({
        ...config,
        base: process.env.STORYBOOK_BASE_URL ?? config.base,
        resolve: {
            ...config.resolve,
            alias: {
                ...config.resolve?.alias,
                "~": `${root}app`,
                "#layers": `${root}layers`,
            },
        },
        define: {
            ...config.define,
            __MESSAGES__: messages,
            __DATETIME_FORMATS__: JSON.stringify(i18nConfig().datetimeFormats),
        },
        plugins: [
            ...(config.plugins ?? []),
            vue(),
            ui({
                ...nuxtConfig.ui,
                ui: appConfig.ui,
                router: true,
                dts: false,
                components: { dirs: componentDirs, directoryAsNamespace: true },
                autoImport: {
                    imports: ["vue", "vue-i18n", "vue-router"],
                    dirs: utilDirs,
                    vueTemplate: true,
                },
            }),
            fontless(fonts),
        ],
    }),
};

export default config;
