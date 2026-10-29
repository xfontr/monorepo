import type { Meta, StoryObj } from "@storybook/vue3-vite";

import HomeTheses from "./Theses.vue";

const thesis = (id: string, title: string, category: string): ArticleSummary => ({
    id,
    slug: `tfg-${id}`,
    title,
    publishedAt: "2024-03-12T09:00:00Z",
    authors: [{ id, slug: `autor-${id}`, name: "Lucía Fernández Prieto" }],
    category: { id, slug: `area-${id}`, name: category },
    tags: [],
    format: "tfg-tfm",
    readingMinutes: 48,
});

const meta: Meta<typeof HomeTheses> = {
    component: HomeTheses,
    args: {
        articles: [
            thesis("1", "La prisión permanente revisable, diez años después", "Derecho penal"),
            thesis("2", "El teletrabajo y el derecho a la desconexión digital", "Derecho laboral"),
            thesis("3", "La gestación por sustitución ante el Tribunal Supremo", "Derecho civil"),
        ],
    },
};

export default meta;

type Story = StoryObj<typeof HomeTheses>;

export const Default: Story = {};
