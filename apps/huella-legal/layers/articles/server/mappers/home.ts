import type { ArticleSummary } from "../../shared/types/ArticleSummary";
import type { Home } from "../../shared/types/Home";
import { toFormats, toSubjects } from "./articleListing";

const LATEST = 5;
const RECENT = 3;
const THESES = 3;

// The index arrives newest first from getArticleIndex
export const toHome = (index: ArticleSummary[]): Home => {
    const [lead, ...rest] = index;

    return {
        lead,
        latest: rest.slice(0, LATEST),
        recent: rest.slice(LATEST, LATEST + RECENT),
        theses: index.filter(({ format }) => format === "tfg-tfm").slice(0, THESES),
        subjects: toSubjects(index),
        formats: toFormats(index).filter(({ count }) => count > 0),
    };
};
