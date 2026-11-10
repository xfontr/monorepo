import { resolve } from "node:path";

export default defineNuxtConfig({
    content: {
        build: {
            markdown: {
                // Keyed by an absolute path because `@nuxt/content` `import()`s the key verbatim,
                // resolving neither a Nuxt alias nor a path relative to itself.
                remarkPlugins: {
                    [resolve(import.meta.dirname, "../../tools/lib/remarkDocLinks.ts")]: {},
                },
            },
        },
    },
});
