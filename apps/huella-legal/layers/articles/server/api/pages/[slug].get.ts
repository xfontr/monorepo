import type { Page } from "../../../shared/types/Page";
import { toPage } from "../../mappers/page";

export default defineEventHandler(async (event): Promise<Page> => {
    const {
        public: { site, pageSlugs },
    } = useRuntimeConfig(event);

    const slug = getRouterParam(event, "slug", { decode: true }) ?? "";

    if (!pageSlugs.includes(slug))
        throw createError({ statusCode: 404, statusMessage: "Page not found" });

    return toPage(await useContent(event).getEntry("pages", slug), site.url);
});
