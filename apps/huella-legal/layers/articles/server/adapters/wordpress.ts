import type { H3Event } from "h3";
import { readAllPages } from "../utils/readAllPages";

const PER_PAGE = 100;

export interface WordpressComment {
    id: number;
    parent: number;
    author_name: string;
    date_gmt: string;
    content: { rendered: string };
}

const unavailable = (cause: unknown) =>
    createError({ statusCode: 502, statusMessage: "WordPress is unavailable", cause });

const readPage = async <T>(event: H3Event, query: Record<string, string | number>) => {
    const { baseURL } = useRuntimeConfig(event).content.vendor;
    const response = await $fetch
        .raw<T[]>("/wp-json/wp/v2/comments", { baseURL, query: { ...query, per_page: PER_PAGE } })
        .catch((cause: unknown) => {
            throw unavailable(cause);
        });

    return {
        items: response._data ?? [],
        totalPages: Number(response.headers.get("x-wp-totalpages") ?? 1),
    };
};

/** Every approved comment on a post, oldest first. */
export const listComments = (event: H3Event, postId: string): Promise<WordpressComment[]> =>
    readAllPages((page) =>
        readPage<WordpressComment>(event, {
            post: postId,
            page,
            order: "asc",
            _fields: "id,parent,author_name,date_gmt,content",
        }),
    );

/** The post id of every approved comment, once per comment. */
export const listCommentedPosts = async (event: H3Event): Promise<string[]> => {
    const comments = await readAllPages((page) =>
        readPage<{ post: number }>(event, { page, _fields: "post" }),
    );

    return comments.map(({ post }) => String(post));
};

export const isOpenForComments = async (event: H3Event, postId: string): Promise<boolean> => {
    const { baseURL } = useRuntimeConfig(event).content.vendor;
    const post = await $fetch<{ comment_status: string }>(`/wp-json/wp/v2/posts/${postId}`, {
        baseURL,
        query: { _fields: "comment_status" },
    }).catch((cause: unknown) => {
        throw unavailable(cause);
    });

    return post.comment_status === "open";
};
