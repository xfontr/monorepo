import type { Meta, StoryObj } from "@storybook/vue3-vite";

import DirectoryCard from "./Card.vue";

const AUTHOR = {
    id: "1",
    slug: "maria-jose-fernandez",
    name: "María José Fernández de la Vega",
    bio: "Graduada en Derecho y doctoranda en Derecho penal. Escribe sobre teoría del delito y política criminal.",
};

const meta: Meta<typeof DirectoryCard> = {
    component: DirectoryCard,
    args: { author: AUTHOR, count: 12 },
};

export default meta;

type Story = StoryObj<typeof DirectoryCard>;

export const Default: Story = {};

export const OnePublication: Story = { args: { count: 1 } };

export const NoBio: Story = { args: { author: { ...AUTHOR, bio: undefined } } };
