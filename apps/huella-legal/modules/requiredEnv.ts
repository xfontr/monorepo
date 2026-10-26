import { defineNuxtModule, useLogger } from "nuxt/kit";

export type RequiredEnv = Record<string, string[]>;

export default defineNuxtModule<RequiredEnv>({
    meta: { name: "required-env", configKey: "requiredEnv" },

    defaults: {},

    setup: (required, { options }) => {
        if (options._prepare || options.test) return;

        const unset = Object.values(required)
            .flat()
            .filter((name) => !process.env[name]);

        if (!unset.length) return;

        const message = `Required env vars are unset: ${unset.join(", ")}`;

        if (process.env.CONTEXT === "production") throw new Error(message);
        if (options.dev) useLogger("required-env").warn(message);
    },
});
