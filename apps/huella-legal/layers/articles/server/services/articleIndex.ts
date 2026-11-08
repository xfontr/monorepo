import { MAX_PER_PAGE } from "@monorepo/content";
import type { H3Event } from "h3";
import type { ArticleSummary } from "../../shared/types/ArticleSummary";
import { readSaved, save } from "../adapters/netlify";
import { toArticleSummary } from "../mappers/articleSummary";
import { isListed } from "./hiddenTerms";
import { readAllPages } from "../utils/readAllPages";

const { cache } = useRuntimeConfig().articles;

const STORE = "article-index";
const KEY = "posts";

const newestFirst = (a: ArticleSummary, b: ArticleSummary): number =>
    (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");

// Nitro's cache lives in one function instance's memory, so a cold instance reads the deploy's
// saved copy before it pages through every post in WordPress
const readArticleIndex = defineCachedFunction(
    async (event: H3Event): Promise<ArticleSummary[]> => {
        const saved = await readSaved<ArticleSummary[]>(STORE, KEY, cache.maxAge);

        if (saved) return saved;

        const content = useContent(event);
        const entries = await readAllPages((page) =>
            content.listEntries("posts", { page, perPage: MAX_PER_PAGE }),
        );
        const index = entries.map(toArticleSummary).sort(newestFirst);

        // Awaited, since Netlify may freeze the function once the response is sent
        await save(STORE, KEY, index);

        return index;
    },
    {
        name: "article-index",
        group: "articles",
        ...cache,
        getKey: () => KEY,
    },
);

// Filtered after the cache, so a change to the hidden tags needs no cache bust
export const getArticleIndex = async (event: H3Event): Promise<ArticleSummary[]> =>
    (await readArticleIndex(event)).filter(isListed);
