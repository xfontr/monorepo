export const FORMAT_KEYS = {
    articulo: "article",
    comentario: "comment",
    ensayo: "essay",
    "tfg-tfm": "thesis",
} as const satisfies Record<ArticleSummary["format"], string>;
