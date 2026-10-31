import type { ArticleComments } from "../../../../shared/types/ArticleComments";
import { isOpenForComments, listComments } from "../../../adapters/wordpress";
import { toArticleComments } from "../../../mappers/articleComments";

defineRouteMeta({
    openAPI: {
        tags: ["Articles"],
        summary: "List an article's approved comments as threads, and whether it takes new ones",
        responses: {
            200: { description: "OK, with no threads when nothing is approved yet" },
            404: { description: "No article has this slug" },
            502: { description: "WordPress is unavailable" },
        },
    },
});

export default defineEventHandler(async (event): Promise<ArticleComments> => {
    const entry = await useContent(event).getEntry(
        "posts",
        getRouterParam(event, "slug", { decode: true }) ?? "",
    );
    const [open, comments] = await Promise.all([
        isOpenForComments(event, entry.id),
        listComments(event, entry.id),
    ]);

    return toArticleComments(open, comments);
});
