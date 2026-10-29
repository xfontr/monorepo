import type { Meta, StoryObj } from "@storybook/vue3-vite";

import SearchResults from "./Results.vue";

const ARTICLE = {
    id: "1",
    slug: "la-culpa",
    title: "La culpa en el Derecho penal contemporáneo",
    excerpt: "Un repaso a la evolución de la culpabilidad como categoría dogmática.",
    publishedAt: "2026-03-12T00:00:00Z",
    authors: [{ id: "1", slug: "maria-ruiz", name: "María Ruiz" }],
    category: { id: "1", slug: "derecho-penal", name: "Derecho penal" },
    tags: [],
    format: "articulo" as const,
    readingMinutes: 12,
};

const SEARCH = {
    items: [1, 2].map((index) => ({
        ...ARTICLE,
        id: String(index),
        slug: `${ARTICLE.slug}-${index}`,
    })),
    page: 1,
    perPage: 20,
    total: 12,
    totalPages: 1,
    query: "culpabilidad",
    subjects: [],
};

const meta: Meta<typeof SearchResults> = {
    component: SearchResults,
    args: { search: SEARCH, to: () => "#" },
};

export default meta;

type Story = StoryObj<typeof SearchResults>;

export const Results: Story = {};

export const NoResults: Story = {
    args: {
        search: {
            ...SEARCH,
            items: [],
            total: 0,
            query: "kardashov",
            subjects: [
                { id: "1", slug: "derecho-penal", name: "Derecho penal" },
                { id: "2", slug: "derecho-civil", name: "Derecho civil" },
            ],
        },
    },
};

export const Loading: Story = { args: { pending: true } };
