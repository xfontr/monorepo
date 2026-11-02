import type { H3Event } from "h3";
import { Refusal, requireEnv } from "../../shared/refusal.ts";
import { createStore } from "../adapters/store.ts";
import { createWordPress } from "../adapters/wordpress.ts";

export const useStore = (event: H3Event) =>
    createStore(requireEnv("NUXT_EDITOR_STORE", useRuntimeConfig(event).editor.store));

export const useWordPress = (event: H3Event) => {
    const { baseURL, username, applicationPassword } = useRuntimeConfig(event).wordpress;

    return createWordPress({
        baseURL,
        username: requireEnv("NUXT_WORDPRESS_USERNAME", username),
        applicationPassword: requireEnv("NUXT_WORDPRESS_APPLICATION_PASSWORD", applicationPassword),
    });
};

/** A broken rule comes back as a 409 whose message the UI shows as-is. */
export const refusing = async <T>(run: () => Promise<T>): Promise<T> => {
    try {
        return await run();
    } catch (error) {
        if (error instanceof Refusal)
            throw createError({ statusCode: 409, message: error.message });
        throw error;
    }
};
