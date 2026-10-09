import type { Meta, StoryObj } from "@storybook/vue3-vite";

import ArticleRelated from "./ArticleRelated.vue";

const CATEGORY = { id: "1", slug: "derecho-penal", name: "Derecho penal" };

const article = (id: string, title: string): ArticleSummary => ({
    id,
    slug: `articulo-${id}`,
    title,
    excerpt: "Una lectura de la jurisprudencia reciente y de lo que cambia para quien estudia la materia por primera vez.",
    publishedAt: "2024-03-12T09:00:00Z",
    authors: [{ id, slug: `autor-${id}`, name: "Luis Martín Ortega" }],
    category: CATEGORY,
    tags: [],
    format: "articulo",
    readingMinutes: 9,
});

const meta: Meta<typeof ArticleRelated> = {
    component: ArticleRelated,
    args: {
        category: CATEGORY,
        articles: [
            article("1", "La teoría jurídica del delito"),
            article("2", "El dolo eventual ante el Tribunal Supremo"),
            article("3", "Imprudencia grave y menos grave tras 2015"),
        ],
    },
};

export default meta;

type Story = StoryObj<typeof ArticleRelated>;

export const ThreeArticles: Story = {};

export const OneArticle: Story = { args: { articles: [article("1", "La teoría jurídica del delito")] } };
