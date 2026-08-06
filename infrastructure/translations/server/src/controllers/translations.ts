import type { Handler } from "hono";

import readLocale from "../utils/readLocale.ts";
import assertSegment from "../utils/assertSegment.ts";
import { HTTP_BAD_REQUEST, HTTP_NOT_FOUND } from "../configs/httpCodes.ts";

const getTranslations: Handler = async ({ req, json }) => {
    const project = req.param("project");
    const locale = req.param("locale");

    if (!assertSegment(project) || !assertSegment(locale)) return json({ error: "Invalid params" }, HTTP_BAD_REQUEST);

    try {
        return json(await readLocale(project, locale));
    }
    catch {
        return json({ error: `Locale "${locale}" not found in "${project}"` }, HTTP_NOT_FOUND);
    }
};

export default getTranslations;
