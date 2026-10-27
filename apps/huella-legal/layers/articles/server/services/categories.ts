import { MAX_PER_PAGE } from "@monorepo/content";
import type { H3Event } from "h3";
import type { Category } from "../../shared/types/Category";
import { toCategory } from "../mappers/articleSummary";
import { readAllPages } from "../utils/readAllPages";

const { cache } = useRuntimeConfig().articles;

export const getCategories = defineCachedFunction(
    async (event: H3Event): Promise<Category[]> => {
        const content = useContent(event);
        const terms = await readAllPages((page) =>
            content.listTerms("categories", { page, perPage: MAX_PER_PAGE }),
        );

        return terms.map(toCategory);
    },
    {
        name: "categories",
        group: "articles",
        ...cache,
        getKey: () => "categories",
    },
);
