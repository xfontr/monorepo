import type { Meta, StoryObj } from "@storybook/vue3-vite";

import HomeFeatured from "./Featured.vue";

const article = (
    id: string,
    title: string,
    format: ArticleSummary["format"] = "articulo",
): ArticleSummary => ({
    id,
    slug: `articulo-${id}`,
    title,
    excerpt:
        "Una lectura de la jurisprudencia reciente y de lo que cambia para quien estudia la materia por primera vez.",
    publishedAt: "2024-03-12T09:00:00Z",
    authors: [{ id, slug: `autor-${id}`, name: "Luis Martín Ortega" }],
    category: { id, slug: "derecho-penal", name: "Derecho penal" },
    tags: [],
    format,
    readingMinutes: 9,
});

const meta: Meta<typeof HomeFeatured> = {
    component: HomeFeatured,
    args: {
        lead: article("1", "La teoría jurídica del delito"),
        latest: [
            article("2", "El tribunal del jurado: la sociedad en el Derecho", "comentario"),
            article("3", "La fecundación post mortem en Argentina"),
            article("4", "Civilización Tipo I de Kardashev, en términos iushumanísticos"),
            article("5", "La prisión permanente revisable, diez años después", "tfg-tfm"),
            article("6", "El principio de legalidad en el Derecho sancionador"),
        ],
    },
};

export default meta;

type Story = StoryObj<typeof HomeFeatured>;

export const Default: Story = {};
