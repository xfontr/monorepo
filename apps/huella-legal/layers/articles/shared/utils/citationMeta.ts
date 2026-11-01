import { LONG_DATE } from "../../../../i18n/dateFormats";
import type { Article } from "../types/Article";
import type { Journal } from "../types/Journal";

interface MetaTag {
    name: string;
    content: string;
}

// In the byline's zone, so Scholar and the page agree on the day; en-CA formats it as YYYY-MM-DD
const ISO_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: LONG_DATE.timeZone });

const scholarDate = (date: string): string => ISO_DAY.format(new Date(date)).replaceAll("-", "/");

/** Google Scholar's tags: title, one per author and the date are the three it requires. */
export const toCitationMeta = (article: Article, journal: Journal): MetaTag[] => [
    { name: "citation_title", content: article.title },
    ...article.authors.map(({ name }) => ({ name: "citation_author", content: name })),
    ...(article.publishedAt
        ? [{ name: "citation_publication_date", content: scholarDate(article.publishedAt) }]
        : []),
    { name: "citation_journal_title", content: journal.name },
    { name: "citation_issn", content: journal.issn },
];
