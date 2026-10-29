import type { Meta, StoryObj } from "@storybook/vue3-vite";

import ArchiveAuthor from "./Author.vue";

const AUTHOR = {
    id: "1",
    slug: "maria-jose-fernandez",
    name: "María José Fernández de la Vega",
    bio: "Graduada en Derecho y doctoranda en Derecho penal. Escribe sobre teoría del delito y política criminal.",
};

const meta: Meta<typeof ArchiveAuthor> = {
    component: ArchiveAuthor,
    args: { author: AUTHOR, total: 12, since: "2021-03-01T00:00:00Z" },
};

export default meta;

type Story = StoryObj<typeof ArchiveAuthor>;

export const Profile: Story = {};

export const OnePublication: Story = { args: { total: 1 } };

export const NoBio: Story = { args: { author: { ...AUTHOR, bio: undefined } } };

export const Undated: Story = { args: { since: undefined } };
