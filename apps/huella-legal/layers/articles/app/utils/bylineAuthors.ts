import type { RouteLocationRaw } from "vue-router";

export const bylineAuthors = (authors: Author[]) =>
    authors.map((author) => ({
        ...author,
        to: { name: "author", params: { slug: author.slug } } satisfies RouteLocationRaw,
    }));
