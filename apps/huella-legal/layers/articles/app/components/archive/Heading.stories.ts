import type { Meta, StoryObj } from "@storybook/vue3-vite";

import ArchiveHeading from "./Heading.vue";

const meta: Meta<typeof ArchiveHeading> = {
    component: ArchiveHeading,
    args: {
        kicker: "Área · 12 publicaciones",
        title: "Derecho penal",
        lead: "Dogmática, teoría del delito, política criminal y análisis de reformas del Código Penal.",
    },
};

export default meta;

type Story = StoryObj<typeof ArchiveHeading>;

export const WithLead: Story = {};

export const NoLead: Story = { args: { lead: undefined } };
