import { resolve } from "node:path";
import { defineCollection, defineContentConfig } from "@nuxt/content";

const WORKSPACE_ROOT = resolve(import.meta.dirname, "../..");

/**
 * The collection reads the workspace's real markdown in place rather than a copy. That is what makes
 * this app cheap: a README edited for GitHub, a review written by the `repo-review` skill and a
 * changelog written by `nx release` are the same files this renders, so the two can never drift.
 * `cwd` is the workspace root, so a page's `path` mirrors its path in the repo.
 */
export default defineContentConfig({
    collections: {
        docs: defineCollection({
            type: "page",
            source: {
                cwd: WORKSPACE_ROOT,
                include: "**/*.md",
                exclude: [
                    "**/node_modules/**",
                    "**/.nx/**",
                    "**/.nuxt/**",
                    "**/.output/**",
                    "**/.report/**",
                    "**/dist/**",
                    "**/coverage/**",
                    "**/storybook-static/**",
                ],
            },
        }),
    },
});
