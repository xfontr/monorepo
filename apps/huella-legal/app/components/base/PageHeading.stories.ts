import type { Meta, StoryObj } from "@storybook/vue3-vite";

import PageHeading from "./PageHeading.vue";

const meta: Meta<typeof PageHeading> = {
    component: PageHeading,
    args: {
        kicker: "Área · 12 publicaciones",
        title: "Derecho penal",
        lead: "Dogmática, teoría del delito, política criminal y análisis de reformas del Código Penal.",
    },
};

export default meta;

type Story = StoryObj<typeof PageHeading>;

export const WithLead: Story = {};

export const NoLead: Story = { args: { lead: undefined } };
