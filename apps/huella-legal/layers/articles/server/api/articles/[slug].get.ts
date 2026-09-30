import type { Entry } from "@monorepo/content";
import type { Article } from "../../../shared/types/Article";
import { toArticle } from "../../mappers/article";

interface Cause {
    statusCode?: number
    statusMessage?: string
}

export default defineEventHandler(async (event): Promise<Article> => {
    const entry = await $fetch<Entry>(`/api/content/posts/${getRouterParam(event, "slug")}`)
        .catch(({ statusCode, statusMessage }: Cause) => {
            throw createError({ statusCode, statusMessage });
        });

    return toArticle(entry);
});
