import type { Meta, StoryObj } from "@storybook/vue3-vite";

import ArticleAuthorCard from "./AuthorCard.vue";

const AUTHOR = {
    id: "1",
    slug: "maria-jose-fernandez",
    name: "María José Fernández de la Vega",
    bio: "Graduada en Derecho y doctoranda en Derecho penal. Escribe sobre teoría del delito y política criminal.",
};

const meta: Meta<typeof ArticleAuthorCard> = {
    component: ArticleAuthorCard,
    args: { author: AUTHOR, to: "#", count: 12 },
};

export default meta;

type Story = StoryObj<typeof ArticleAuthorCard>;

export const WithCount: Story = {};

export const OnePublication: Story = { args: { count: 1 } };

export const CountUnknown: Story = { args: { count: undefined } };

export const NoBio: Story = { args: { author: { ...AUTHOR, bio: undefined } } };
