import { createError, defineEventHandler, readBody } from "h3";
import { applyEdit } from "../../utils/workflows.ts";

/** The deployed site is a static prerender with no server, so this only ever answers under `nuxt dev`. */
export default defineEventHandler(async (event) => {
    if (!import.meta.dev) throw createError({ statusCode: 404 });

    const problem = await applyEdit(await readBody<unknown>(event));

    if (problem !== null) throw createError({ statusCode: 422, statusMessage: problem });

    return { ok: true };
});
