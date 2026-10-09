import type { Meta, StoryObj } from "@storybook/vue3-vite";

import ArticleHeader from "./ArticleHeader.vue";

const MARIA = { id: "1", slug: "maria-jose-fernandez", name: "María José Fernández de la Vega" };
const LUIS = { id: "2", slug: "luis-martin-ortega", name: "Luis Martín Ortega" };

const ARTICLE: Article = {
    id: "1",
    slug: "el-tribunal-del-jurado",
    title: "El tribunal del jurado en España",
    excerpt: "Una lectura de la jurisprudencia reciente y de lo que cambia para quien estudia la materia por primera vez.",
    publishedAt: "2024-03-12T09:00:00Z",
    authors: [MARIA],
    category: { id: "1", slug: "derecho-penal", name: "Derecho penal" },
    tags: [],
    format: "articulo",
    readingMinutes: 14,
    body: { lead: "", html: "", toc: [], notes: [], bibliography: [] },
    permalink: "https://huellalegal.test/el-tribunal-del-jurado/",
    citations: [],
};

const meta: Meta<typeof ArticleHeader> = {
    component: ArticleHeader,
    args: { article: ARTICLE },
};

export default meta;

type Story = StoryObj<typeof ArticleHeader>;

export const Article: Story = {};

export const SeveralAuthors: Story = { args: { article: { ...ARTICLE, authors: [MARIA, LUIS], format: "tfg-tfm" } } };

export const NoCategory: Story = { args: { article: { ...ARTICLE, category: undefined, format: "ensayo" } } };

export const NoExcerpt: Story = { args: { article: { ...ARTICLE, excerpt: undefined, format: "comentario" } } };
