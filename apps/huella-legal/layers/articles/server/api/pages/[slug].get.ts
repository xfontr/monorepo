import type { Page } from "../../../shared/types/Page";
import { toPage } from "../../mappers/page";

defineRouteMeta({
    openAPI: {
        tags: ["Articles"],
        summary: "Read one of the site's configured WordPress pages",
        responses: {
            200: { description: "OK" },
            404: { description: "The slug isn't a configured page, or WordPress has no such page" },
        },
    },
});

export default defineEventHandler(async (event): Promise<Page> => {
    const {
        public: { site, pageSlugs },
    } = useRuntimeConfig(event);

    const slug = getRouterParam(event, "slug", { decode: true }) ?? "";

    if (!pageSlugs.includes(slug))
        throw createError({ statusCode: 404, statusMessage: "Page not found" });

    return toPage(await useContent(event).getEntry("pages", slug), site.url);
});
