import type { Author as ContentAuthor, Entry, RichText, Term } from "@monorepo/content";
import { toText as hastToText } from "hast-util-to-text";
import rehypeParse from "rehype-parse";
import { unified } from "unified";
import type { ArticleSummary } from "../../shared/types/ArticleSummary";
import type { Author } from "../../shared/types/Author";
import type { Category } from "../../shared/types/Category";

const WORDS_PER_MINUTE = 230;

const parser = unified().use(rehypeParse, { fragment: true });

const FORMAT_SLUGS = {
    thesisTag: "trabajos-de-fin-de-grado",
    essayCategory: "ensayos",
    caseCommentTagPrefix: "jurisprudencia-",
} as const;

export function toArticleSummary(entry: Entry): ArticleSummary {
    const categories = entry.terms.filter((term) => term.resource === "categories").map(toCategory);
    const tags = entry.terms.filter((term) => term.resource === "tags").map(toCategory);

    return {
        id: entry.id,
        slug: entry.slug,
        title: toText(entry.title),
        excerpt: toExcerpt(entry.excerpt),
        publishedAt: entry.publishedAt,
        updatedAt: entry.updatedAt,
        image: entry.image,
        authors: entry.authors.map(toAuthor),
        category: categories[0],
        tags,
        format: toFormat(categories.map(({ slug }) => slug), tags.map(({ slug }) => slug)),
        readingMinutes: toReadingMinutes(entry.body),
    };
}

// A post carrying more than one marker takes the first rule that matches
function toFormat(categorySlugs: string[], tagSlugs: string[]): ArticleSummary["format"] {
    if (tagSlugs.includes(FORMAT_SLUGS.thesisTag)) return "tfg-tfm";
    if (categorySlugs.includes(FORMAT_SLUGS.essayCategory)) return "ensayo";
    if (tagSlugs.some((slug) => slug.startsWith(FORMAT_SLUGS.caseCommentTagPrefix))) return "comentario";

    return "articulo";
}

function toCategory(term: Term): Category {
    return {
        id: term.id,
        slug: term.slug,
        name: toText(term.name),
        description: term.description && toText(term.description),
    };
}

function toAuthor(author: ContentAuthor): Author {
    return {
        id: author.id,
        slug: author.slug,
        name: toText(author.name),
        bio: author.bio && toText(author.bio),
        avatar: author.avatar,
    };
}

function toReadingMinutes(body: RichText): number {
    const text = body.format === "blocks" ? "" : toText(body.value);
    const words = text.split(" ").filter(Boolean).length;

    return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

// WordPress renders titles and excerpts as entity-escaped HTML; this is display text, not sanitising
function toText(html: string): string {
    return hastToText(parser.parse(html)).replace(/\s+/g, " ").trim();
}

// WordPress closes an excerpt it generated itself with a bracketed ellipsis
function toExcerpt(excerpt?: RichText): string | undefined {
    if (!excerpt || excerpt.format === "blocks") return undefined;

    return toText(excerpt.value).replace(/\s*\[…\]$/, "") || undefined;
}
