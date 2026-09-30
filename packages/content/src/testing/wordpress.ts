import { http, HttpResponse, type HttpHandler } from "msw";
import { API_PATH, TAXONOMIES } from "#core/adapters/providers/wordpress/WordpressConfigs";
import type { WordpressEntry, WordpressTerm, WordpressUser, WordpressYoast } from "#core/adapters/providers/wordpress/WordpressTypes";
import type { Author, Entry, EntryResource, RichText, SEO, Term, TermResource } from "#core/domain/content";

export type WordpressContent = Partial<Record<EntryResource, Entry[]> & Record<TermResource, Term[]>>;

/** MSW handlers that serve domain entries and terms the way WordPress's REST API would. */
export function wordpressHandlers(baseURL: string, content: WordpressContent): HttpHandler[] {
    return [
        http.get(`${baseURL}${API_PATH}/:resource`, ({ params, request }) => {
            const items = toWordpress(params.resource as keyof WordpressContent, content);

            if (!items) return HttpResponse.json({ code: "rest_no_route" }, { status: 404 });

            const query = new URL(request.url).searchParams;
            const slug = query.get("slug");
            const page = Number(query.get("page") ?? 1);
            const perPage = Number(query.get("per_page") ?? 10);

            const matches = slug ? items.filter((item) => item.slug === slug) : items;
            const totalPages = Math.max(1, Math.ceil(matches.length / perPage));

            // WordPress refuses a page past the end rather than answering an empty one
            if (page > totalPages) {
                return HttpResponse.json({ code: "rest_post_invalid_page_number" }, { status: 400 });
            }

            return HttpResponse.json(matches.slice((page - 1) * perPage, page * perPage), {
                headers: { "x-wp-total": String(matches.length), "x-wp-totalpages": String(totalPages) },
            });
        }),
    ];
}

function toWordpress(resource: keyof WordpressContent, content: WordpressContent): (WordpressEntry | WordpressTerm)[] | undefined {
    if (resource === "posts" || resource === "pages") return content[resource]?.map(toWordpressEntry);

    return content[resource]?.map(toWordpressTerm);
}

function toWordpressEntry(entry: Entry): WordpressEntry {
    return {
        id: Number(entry.id),
        slug: entry.slug,
        title: { rendered: entry.title },
        content: { rendered: toRendered(entry.body) },
        excerpt: entry.excerpt && { rendered: toRendered(entry.excerpt) },
        date_gmt: entry.publishedAt?.replace(/Z$/, ""),
        modified_gmt: entry.updatedAt?.replace(/Z$/, ""),
        yoast_head_json: toYoast(entry.seo),
        _embedded: {
            "wp:featuredmedia": entry.image
                ? [{ id: Number(entry.image.id), source_url: entry.image.url, alt_text: entry.image.alt, media_details: { width: entry.image.width, height: entry.image.height } }]
                : [],
            "wp:term": [entry.terms.map(toWordpressTerm)],
            "author": entry.authors.map(toWordpressUser),
        },
    };
}

function toWordpressTerm(term: Term): WordpressTerm {
    const taxonomy = Object.keys(TAXONOMIES).find((name) => TAXONOMIES[name] === term.resource) ?? term.resource;

    return { id: Number(term.id), name: term.name, slug: term.slug, taxonomy, description: term.description, yoast_head_json: toYoast(term.seo) };
}

// The provider names an avatar after its author, so an avatar's `alt` doesn't survive the trip
function toWordpressUser(author: Author): WordpressUser {
    return {
        id: Number(author.id),
        name: author.name,
        slug: author.slug,
        description: author.bio,
        simple_local_avatar: author.avatar ? { media_id: Number(author.avatar.id), full: author.avatar.url } : false,
    };
}

function toYoast(seo?: SEO): WordpressYoast | undefined {
    return seo && { title: seo.title, description: seo.description, robots: { index: seo.noindex ? "noindex" : "index" } };
}

// WordPress only ever renders HTML, so a block document has nothing to stand in for it
function toRendered(text: RichText): string {
    return text.format === "blocks" ? "" : text.value;
}
