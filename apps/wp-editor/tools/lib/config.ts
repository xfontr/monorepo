import type { WordPressCredentials } from "../../server/adapters/wordpress.ts";
import { requireEnv } from "../../shared/refusal.ts";
import { WORDPRESS_BASE_URL } from "../../shared/site.ts";

export const storePath = (): string =>
    requireEnv("NUXT_EDITOR_STORE", process.env.NUXT_EDITOR_STORE);

export const credentials = (): WordPressCredentials => ({
    baseURL: process.env.NUXT_WORDPRESS_BASE_URL || WORDPRESS_BASE_URL,
    username: requireEnv("NUXT_WORDPRESS_USERNAME", process.env.NUXT_WORDPRESS_USERNAME),
    applicationPassword: requireEnv(
        "NUXT_WORDPRESS_APPLICATION_PASSWORD",
        process.env.NUXT_WORDPRESS_APPLICATION_PASSWORD,
    ),
});
