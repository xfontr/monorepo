import { JOURNAL_LOCALE } from "../../../../i18n/dateFormats";
import type { Facet } from "../../shared/types/Facet";

export const toFacets = <T extends { id: string }>(values: T[]): Facet<T>[] => {
    const facets = new Map<string, Facet<T>>();

    for (const value of values) {
        facets.set(value.id, { value, count: (facets.get(value.id)?.count ?? 0) + 1 });
    }

    return [...facets.values()];
};

export const byName = <T extends { name: string }>(a: Facet<T>, b: Facet<T>): number =>
    a.value.name.localeCompare(b.value.name, JOURNAL_LOCALE);
