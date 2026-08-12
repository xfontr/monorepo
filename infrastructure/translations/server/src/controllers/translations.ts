import type { Handler } from "hono";

import readLocale from "../utils/readLocale.ts";
import assertSegment from "../utils/assertSegment.ts";
import { HTTP_BAD_REQUEST, HTTP_NOT_FOUND, HTTP_SERVER_ERROR } from "../configs/httpCodes.ts";

const getTranslations: Handler = async ({ req, json }) => {
    const project = req.param("project");
    const locale = req.param("locale");

    if (!assertSegment(project) || !assertSegment(locale)) return json({ error: "Invalid params" }, HTTP_BAD_REQUEST);

    try {
        return json(await readLocale(project, locale));
    }
    catch (cause) {
        if (isMissingFile(cause)) return json({ error: `Locale "${locale}" not found in "${project}"` }, HTTP_NOT_FOUND);
        return json({ error: `Locale "${locale}" in "${project}" could not be read` }, HTTP_SERVER_ERROR);
    }
};

function isMissingFile(cause: unknown): boolean {
    return cause instanceof Error && "code" in cause && cause.code === "ENOENT";
}

export default getTranslations;
