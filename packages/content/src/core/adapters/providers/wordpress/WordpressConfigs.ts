import type { TermResource } from "#core/domain/content";

export const API_PATH = "/wp-json/wp/v2";

// WP rejects anything above this
export const WP_MAX_PER_PAGE = 100;

export const TAXONOMIES: Record<string, TermResource | undefined> = {
    category: "categories",
    post_tag: "tags",
};
