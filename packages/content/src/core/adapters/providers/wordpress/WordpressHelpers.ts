import type {
    Asset,
    Author,
    Entry,
    Page,
    Query,
    SEO,
    Term,
    TermResource,
} from "#core/domain/content";
import { DEFAULT_PER_PAGE } from "#core/domain/content";
import type { HttpResponse, RequestOptions } from "#core/ports/HttpClient";
import { TAXONOMIES, WP_MAX_PER_PAGE } from "./WordpressConfigs";
import type {
    WordpressEntry,
    WordpressMedia,
    WordpressTerm,
    WordpressUser,
    WordpressYoast,
} from "./WordpressTypes";

const toPerPage = (perPage?: number): number =>
    Math.min(perPage ?? DEFAULT_PER_PAGE, WP_MAX_PER_PAGE);

export const toWordpressQuery = (query?: Query): RequestOptions["query"] => ({
    page: query?.page,
    // Always sent, so the perPage a Page reports is the one that was requested rather than
    // whatever WordPress happens to default to
    per_page: toPerPage(query?.perPage),
    slug: query?.slug,
    search: query?.search,
});

export const toPage = <S, T>(
    { data, headers }: HttpResponse<S[]>,
    query: Query | undefined,
    map: (source: S) => T,
): Page<T> => {
    const items = (data ?? []).map(map);

    return {
        items,
        page: query?.page ?? 1,
        perPage: toPerPage(query?.perPage),
        total: toCount(headers.get("x-wp-total"), items.length),
        totalPages: toCount(headers.get("x-wp-totalpages"), 1),
    };
};

// A proxy or plugin can drop these headers or rewrite them into something non-numeric. The empty
// string is checked separately because Number("") is 0, which would pass an integer guard and report
// a populated list as having no pages.
const toCount = (header: string | null, fallback: number): number => {
    if (!header?.trim()) return fallback;

    const count = Number(header);

    return Number.isInteger(count) && count >= 0 ? count : fallback;
};

export const toEntry = (entry: WordpressEntry): Entry => ({
    id: String(entry.id),
    slug: entry.slug,
    title: entry.title.rendered,
    excerpt: entry.excerpt ? { format: "html", value: entry.excerpt.rendered } : undefined,
    body: { format: "html", value: entry.content.rendered },
    publishedAt: toIsoDate(entry.date_gmt),
    updatedAt: toIsoDate(entry.modified_gmt),
    image: toAsset(entry._embedded?.["wp:featuredmedia"]?.[0]),
    terms: (entry._embedded?.["wp:term"] ?? []).flat().flatMap(toEmbeddedTerm),
    authors: (entry._embedded?.author ?? []).flatMap(toAuthor),
    seo: toSEO(entry.yoast_head_json),
});

// An entry embeds every taxonomy the site defines, including custom ones the domain has no name for
const toEmbeddedTerm = (term: WordpressTerm): Term[] => {
    const resource = TAXONOMIES[term.taxonomy];

    return resource ? [toTerm(term, resource)] : [];
};

export const toTerm = (term: WordpressTerm, resource: TermResource): Term => ({
    id: String(term.id),
    // Falls back to what the caller asked for, so a custom taxonomy is never relabelled as a tag
    resource: TAXONOMIES[term.taxonomy] ?? resource,
    slug: term.slug,
    name: term.name,
    description: term.description || undefined,
    seo: toSEO(term.yoast_head_json),
});

// An embed with no id or name is not a user, so it is dropped rather than rendered as a blank byline
const toAuthor = (user: WordpressUser): Author[] => {
    if (user.id === undefined || !user.name) return [];

    return [
        {
            id: String(user.id),
            slug: user.slug,
            name: user.name,
            bio: user.description || undefined,
            avatar: toAvatar(user),
        },
    ];
};

const toAvatar = (user: WordpressUser): Asset | undefined => {
    const avatar = user.simple_local_avatar;

    if (!avatar || !avatar.full) return undefined;

    return {
        id: String(avatar.media_id ?? user.id),
        url: avatar.full,
        alt: user.name,
    };
};

const toSEO = (yoast?: WordpressYoast): SEO | undefined => {
    if (!yoast) return undefined;

    return {
        title: yoast.title || undefined,
        description: yoast.description || undefined,
        noindex: yoast.robots?.index === "noindex",
    };
};

// An inaccessible featured image embeds as a REST error object instead of a media item
const toAsset = (media?: WordpressMedia): Asset | undefined => {
    if (!media?.source_url) return undefined;

    return {
        id: String(media.id),
        url: media.source_url,
        alt: media.alt_text ?? "",
        width: media.media_details?.width,
        height: media.media_details?.height,
    };
};

// WordPress reports GMT timestamps without a zone designator, so they parse as local time unless suffixed
const toIsoDate = (date?: string | null): string | undefined => {
    if (!date) return undefined;
    return date.endsWith("Z") ? date : `${date}Z`;
};
