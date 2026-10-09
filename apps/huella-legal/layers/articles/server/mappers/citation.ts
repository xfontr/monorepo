import type { ArticleSummary } from "../../shared/types/ArticleSummary";
import type { Citation } from "../../shared/types/Citation";

export interface Journal {
    name: string
    issn: string
    permalink: string
}

// The same zone as the page's `long` date, so a post published just after midnight cites the same day
const DATE = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" });

const LIST = new Intl.ListFormat("es-ES", { type: "conjunction" });

export function toCitations({ authors, title, publishedAt }: ArticleSummary, { name, issn, permalink }: Journal): Citation[] {
    const date = publishedAt && DATE.format(new Date(publishedAt));
    // WordPress keeps one display name, so the first word is read as the given name and the rest as surnames
    const inverted = authors.map((author) => {
        const [given = "", ...surnames] = author.name.trim().split(/\s+/);

        return `${surnames.join(" ")}, ${given.charAt(0)}.`;
    });

    return [
        { style: "APA 7", text: `${LIST.format(inverted)} (${date?.replace(/^(.+) de (\d{4})$/, "$2, $1") ?? "s. f."}). ${title}. ${name}. ${permalink}` },
        { style: name, text: `${inverted.join("; ").toLocaleUpperCase("es-ES")}, «${title}», ${name}${date ? `, ${date}` : ""}. ISSN ${issn}. Disponible en: ${permalink}` },
    ];
}
