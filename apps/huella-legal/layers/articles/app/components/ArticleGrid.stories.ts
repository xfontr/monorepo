import type { Meta, StoryObj } from "@storybook/vue3-vite";

import ArticleGrid from "./ArticleGrid.vue";

const article = (id: string, title: string, category: string): ArticleSummary => ({
    id,
    slug: `articulo-${id}`,
    title,
    excerpt: "Una lectura de la jurisprudencia reciente y de lo que cambia para quien estudia la materia por primera vez.",
    publishedAt: "2024-03-12T09:00:00Z",
    authors: [{ id, slug: `autor-${id}`, name: "Luis Martín Ortega" }],
    category: { id, slug: `materia-${id}`, name: category },
    tags: [],
    format: "articulo",
    readingMinutes: 9,
});

const ARTICLES = [
    article("1", "El tribunal del jurado en España", "Derecho penal"),
    article("2", "La fecundación post mortem y el Código Civil", "Derecho civil"),
    article("3", "Civilización Tipo I de Kardashev, en términos iushumanísticos", "Teoría del Derecho"),
];

const meta: Meta<typeof ArticleGrid> = {
    component: ArticleGrid,
    args: { articles: ARTICLES },
};

export default meta;

type Story = StoryObj<typeof ArticleGrid>;

export const ThreeColumns: Story = {};

export const TwoColumnsStandard: Story = { args: { articles: ARTICLES.slice(0, 2), variant: "standard", columns: 2 } };
