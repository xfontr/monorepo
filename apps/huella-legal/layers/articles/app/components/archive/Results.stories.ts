import type { Meta, StoryObj } from "@storybook/vue3-vite";

import ArchiveResults from "./Results.vue";

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

const LISTING = {
    items: [1, 2, 3].map((index) => ({
        ...ARTICLE,
        id: String(index),
        slug: `${ARTICLE.slug}-${index}`,
    })),
    page: 1,
    perPage: 20,
    total: 48,
    totalPages: 3,
    formats: [],
    subjects: [],
};

const meta: Meta<typeof ArchiveResults> = {
    component: ArchiveResults,
    args: { listing: LISTING, to: () => "#", sort: "newest" },
};

export default meta;

type Story = StoryObj<typeof ArchiveResults>;

export const Archive: Story = {
    args: {
        formatPills: [
            { label: "Todo", count: 48, to: "#", active: true },
            { label: "Artículos", count: 40, to: "#" },
            { label: "Ensayos", count: 8, to: "#" },
        ],
    },
};

export const Subject: Story = {};

export const Profile: Story = { args: { heading: "Publicaciones" } };

export const Pending: Story = { args: { pending: true } };

export const Empty: Story = {
    args: {
        listing: { ...LISTING, items: [], total: 0, totalPages: 1 },
        emptySubject: "Derecho penal",
    },
};
