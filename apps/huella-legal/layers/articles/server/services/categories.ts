import { MAX_PER_PAGE } from "@monorepo/content";
import type { H3Event } from "h3";
import type { Category } from "../../shared/types/Category";
import { toCategory } from "../mappers/articleSummary";
import { readAllPages } from "../utils/readAllPages";

const MAX_AGE = 60 * 60;
const STALE_MAX_AGE = 60 * 60 * 24;

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
        maxAge: MAX_AGE,
        staleMaxAge: STALE_MAX_AGE,
        getKey: () => "categories",
        shouldBypassCache: () => import.meta.dev === true,
    },
);
