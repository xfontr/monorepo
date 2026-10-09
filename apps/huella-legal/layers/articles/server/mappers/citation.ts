import { JOURNAL_LOCALE, LONG_DATE } from "../../../../i18n/dateFormats";
import type { ArticleSummary } from "../../shared/types/ArticleSummary";
import type { Citation } from "../../shared/types/Citation";

export interface Journal {
    name: string
    issn: string
}

interface Source {
    authors: string[]
    title: string
    date?: Date
    journal: Journal
    permalink: string
}

const DATE = new Intl.DateTimeFormat(JOURNAL_LOCALE, LONG_DATE);
const LIST = new Intl.ListFormat(JOURNAL_LOCALE, { type: "conjunction" });

export function toCitations({ authors, title, publishedAt }: ArticleSummary, journal: Journal, permalink: string): Citation[] {
    const source: Source = {
        authors: authors.map(({ name }) => invertName(name)),
        title,
        date: publishedAt ? new Date(publishedAt) : undefined,
        journal,
        permalink,
    };

    return [
        { style: "APA 7", text: apa7(source) },
        { style: journal.name, text: journalStyle(source) },
    ];
}

function apa7({ authors, title, date, journal, permalink }: Source): string {
    return `${LIST.format(authors)} (${date ? apaDate(date) : "s. f."}). ${title}. ${journal.name}. ${permalink}`;
}

function journalStyle({ authors, title, date, journal, permalink }: Source): string {
    const published = date ? `, ${DATE.format(date)}` : "";

    return `${authors.join("; ").toLocaleUpperCase(JOURNAL_LOCALE)}, «${title}», ${journal.name}${published}. ISSN ${journal.issn}. Disponible en: ${permalink}`;
}

function apaDate(date: Date): string {
    const { year, day, month } = Object.fromEntries(DATE.formatToParts(date).map(({ type, value }) => [type, value]));

    return `${year}, ${day} de ${month}`;
}

// WordPress keeps one display name, so the first word is read as the given name and the rest as surnames
function invertName(name: string): string {
    const [given = "", ...surnames] = name.trim().split(/\s+/);

    return `${surnames.join(" ")}, ${given.charAt(0)}.`;
}
