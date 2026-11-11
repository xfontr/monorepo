import { createError, defineEventHandler, getRequestHeader, readBody } from "h3";
import { applyEdit } from "../../utils/workflows.ts";

/** The deployed site is a static prerender with no server, so this only ever answers under `nuxt dev`. */
export default defineEventHandler(async (event) => {
    // A cross-site HTML form can post here without a preflight; it can't send JSON or same-origin.
    const site = getRequestHeader(event, "sec-fetch-site");
    if (site !== undefined && site !== "same-origin") throw createError({ statusCode: 403 });
    if (!getRequestHeader(event, "content-type")?.startsWith("application/json")) {
        throw createError({ statusCode: 415 });
    }

    if (!import.meta.dev) throw createError({ statusCode: 404 });

    const problem = await applyEdit(await readBody<unknown>(event));

    if (problem !== null) throw createError({ statusCode: 422, statusMessage: problem });

    return { ok: true };
});
