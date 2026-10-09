import type { Meta, StoryObj } from "@storybook/vue3-vite";

import ArticleBackMatter from "./BackMatter.vue";

const ARTICLE: Article = {
    id: "1",
    slug: "el-tribunal-del-jurado",
    title: "El tribunal del jurado en España",
    authors: [
        {
            id: "1",
            slug: "maria-jose-fernandez",
            name: "María José Fernández de la Vega",
            bio: "Graduada en Derecho y doctoranda en Derecho penal. Escribe sobre teoría del delito y política criminal.",
        },
    ],
    tags: [
        { id: "1", slug: "jurado", name: "Jurado" },
        { id: "2", slug: "proceso-penal", name: "Proceso penal" },
    ],
    format: "articulo",
    readingMinutes: 14,
    body: {
        lead: "",
        html: "",
        toc: [],
        notes: [{ id: "1", html: "Artículo 125 de la <em>Constitución Española</em>." }],
        bibliography: ["GIMENO SENDRA, V., <em>Derecho procesal penal</em>, Civitas, 2019."],
    },
    permalink: "https://huellalegal.test/el-tribunal-del-jurado/",
    citations: [
        {
            style: "APA 7",
            text: "Fernández de la Vega, M. J. (2024, 12 de marzo). El tribunal del jurado en España. Huella Legal.",
        },
        {
            style: "Huella Legal",
            text: "FERNÁNDEZ DE LA VEGA, M. J., «El tribunal del jurado en España», Huella Legal, 12 de marzo de 2024.",
        },
    ],
};

const meta: Meta<typeof ArticleBackMatter> = {
    component: ArticleBackMatter,
    args: { article: ARTICLE },
};

export default meta;

type Story = StoryObj<typeof ArticleBackMatter>;

export const Complete: Story = {};

export const NoNotesOrTags: Story = {
    args: {
        article: { ...ARTICLE, tags: [], body: { ...ARTICLE.body, notes: [], bibliography: [] } },
    },
};
