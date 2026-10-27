import { JOURNAL_LOCALE } from "../../../../i18n/dateFormats";
import type { ArticleSummary } from "../../shared/types/ArticleSummary";
import type { Author } from "../../shared/types/Author";
import type { Facet } from "../../shared/types/Facet";
import { toFacets } from "./facet";

// WordPress users carry no post count, so it comes from the index (ADR 0027)
export const toAuthorDirectory = (index: ArticleSummary[]): Facet<Author>[] =>
    toFacets(index.flatMap(({ authors }) => authors)).sort(
        (a, b) => b.count - a.count || a.value.name.localeCompare(b.value.name, JOURNAL_LOCALE),
    );
