export const FORMAT_KEYS = {
    articulo: "article",
    comentario: "comment",
    "tfg-tfm": "thesis",
} as const satisfies Record<ArticleSummary["format"], string>;
