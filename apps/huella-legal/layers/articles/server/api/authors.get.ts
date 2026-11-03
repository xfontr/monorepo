import type { Author } from "../../shared/types/Author";
import type { Facet } from "../../shared/types/Facet";
import { toAuthorDirectory } from "../mappers/authorDirectory";
import { getArticleIndex } from "../services/articleIndex";

export default defineEventHandler(async (event): Promise<Facet<Author>[]> =>
    toAuthorDirectory(await getArticleIndex(event)),
);

defineRouteMeta({
    openAPI: {
        tags: ["Articles"],
        summary: "List every author with the number of articles they wrote",
    },
});
