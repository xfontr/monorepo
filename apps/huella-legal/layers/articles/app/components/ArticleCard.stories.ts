import type { Meta, StoryObj } from "@storybook/vue3-vite";

import ArticleCard from "./ArticleCard.vue";

// An opaque stand-in, since a transparent pixel would leave the frame looking empty
const IMAGE = { id: "1", url: `data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 2'><rect width='3' height='2' fill='slategray'/></svg>")}`, alt: "", width: 1200, height: 800 };

const ARTICLE: ArticleSummary = {
    id: "1",
    slug: "la-teoria-juridica-del-delito",
    title: "La teoría jurídica del delito",
    excerpt: "Tipicidad, antijuridicidad y culpabilidad: una guía para entender cómo se construye la teoría del delito y por qué cada categoría importa.",
    publishedAt: "2024-03-12T09:00:00Z",
    authors: [{ id: "1", slug: "maria-jose", name: "María José Fernández de la Vega" }],
    category: { id: "1", slug: "derecho-penal", name: "Derecho penal" },
    tags: [],
    format: "articulo",
    readingMinutes: 14,
};

const meta: Meta<typeof ArticleCard> = {
    component: ArticleCard,
    args: { article: ARTICLE },
};

export default meta;

type Story = StoryObj<typeof ArticleCard>;

export const Standard: Story = {};

export const Lead: Story = { args: { variant: "lead", article: { ...ARTICLE, image: IMAGE } } };

export const LeadWithoutImage: Story = { args: { variant: "lead" } };

export const Media: Story = { args: { variant: "media", article: { ...ARTICLE, image: IMAGE } } };

export const MediaWithoutImage: Story = { args: { variant: "media" } };

export const Row: Story = { args: { variant: "row" } };

export const Compact: Story = { args: { variant: "compact" } };

export const Uncategorised: Story = { args: { article: { ...ARTICLE, category: undefined } } };
