import type { ArticleSummary } from "../../shared/types/ArticleSummary";
import type { Category } from "../../shared/types/Category";
import type { SubjectIndex } from "../../shared/types/SubjectIndex";
import { toFormats, toSubjects } from "./articleListing";
import { isTopic } from "./articleSummary";
import { byName, toFacets } from "./facet";

export const toSubjectIndex = (index: ArticleSummary[], categories: Category[]): SubjectIndex => {
    const described = new Map(categories.map((category) => [category.id, category]));

    return {
        subjects: toSubjects(index).map(({ value, count }) => ({
            value: described.get(value.id) ?? value,
            count,
        })),
        formats: toFormats(index),
        topics: toFacets(index.flatMap(({ tags }) => tags))
            .filter(({ value }) => isTopic(value))
            .sort(byName),
    };
};
