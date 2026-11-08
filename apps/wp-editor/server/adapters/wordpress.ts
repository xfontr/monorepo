import { ofetch } from "ofetch";
import type { BaseMeta, PostType, Proposal, Snapshot } from "../../shared/types.ts";

export interface WordPressCredentials {
    baseURL: string;
    username: string;
    applicationPassword: string;
}

/** The `?context=edit` shape, trimmed to what the editor reads. */
export interface WpPost {
    id: number;
    type: string;
    status: string;
    date: string;
    modified_gmt: string;
    link: string;
    title: { raw: string };
    excerpt: { raw: string };
    content: { raw: string };
    _embedded?: {
        author?: { name?: string }[];
        "wp:featuredmedia"?: {
            source_url?: string;
            media_details?: { sizes?: { thumbnail?: { source_url?: string } } };
        }[];
    };
}

export const toSnapshot = (post: WpPost): Snapshot & BaseMeta => {
    const media = post._embedded?.["wp:featuredmedia"]?.[0];

    return {
        title: post.title.raw,
        excerpt: post.excerpt.raw,
        content: post.content.raw,
        modifiedGmt: post.modified_gmt,
        date: post.date,
        status: post.status,
        link: post.link,
        author: post._embedded?.author?.[0]?.name ?? "",
        image: media?.media_details?.sizes?.thumbnail?.source_url ?? media?.source_url ?? null,
    };
};

const PAGE_SIZE = 100;

export type WordPress = ReturnType<typeof createWordPress>;

export const createWordPress = ({
    baseURL,
    username,
    applicationPassword,
}: WordPressCredentials) => {
    const credentials = btoa(`${username}:${applicationPassword}`);
    const api = ofetch.create({
        baseURL: `${baseURL}/wp-json/wp/v2`,
        headers: { Authorization: `Basic ${credentials}` },
    });
    const edit = { context: "edit", _embed: "author,wp:featuredmedia" };

    return {
        /** Every item of `type` in `status`, following WordPress's `X-WP-TotalPages`. */
        list: async (type: PostType, status = "publish"): Promise<WpPost[]> => {
            const fetchPage = (page: number) =>
                api.raw<WpPost[]>(`/${type}`, {
                    query: { ...edit, status, per_page: PAGE_SIZE, page },
                });

            const first = await fetchPage(1);
            const pages = Number(first.headers.get("x-wp-totalpages") ?? 1);
            const rest = await Promise.all(
                Array.from({ length: Math.max(pages - 1, 0) }, (_, index) => fetchPage(index + 2)),
            );

            return [first, ...rest].flatMap((response) => response._data ?? []);
        },

        get: (type: PostType, id: number) => api<WpPost>(`/${type}/${id}`, { query: edit }),

        update: (type: PostType, id: number, { content, title, excerpt }: Proposal) =>
            api<WpPost>(`/${type}/${id}`, {
                method: "PUT",
                query: { context: "edit" },
                body: { content, title, excerpt },
            }),

        create: (type: PostType, body: Record<string, string>) =>
            api<WpPost>(`/${type}`, { method: "POST", query: { context: "edit" }, body }),

        remove: (type: PostType, id: number) =>
            api(`/${type}/${id}`, { method: "DELETE", query: { force: true } }),

        revisions: (type: PostType, id: number) => api<unknown[]>(`/${type}/${id}/revisions`),
    };
};
