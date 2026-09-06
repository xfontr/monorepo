import { eslint } from "@monorepo/configs";

export default [
    ...eslint.createNuxtConfig(),

    // `pnpm tech-docs:collect` vendors Nx's graph client and Istanbul's HTML report in here to be
    // served as-is. Minified third-party output, not source — and the shared `**/coverage` ignore
    // only catches half of it. Linting the rest reports a third of a million errors in files
    // nobody in this repo wrote.
    { ignores: ["public/embed/**"] },
];
