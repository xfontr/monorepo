import { resolve } from "node:path";
import { defineCollection, defineContentConfig } from "@nuxt/content";

const WORKSPACE_ROOT = resolve(import.meta.dirname, "../..");

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
                    // Each is a full checkout of the repo at a point in time — every doc in it duplicates one already collected.
                    "**/.claude/worktrees/**",
                ],
            },
        }),
    },
});
