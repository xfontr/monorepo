import type { Meta, StoryObj } from "@storybook/vue3-vite";

import SectionHeading from "./SectionHeading.vue";

const meta: Meta<typeof SectionHeading> = {
    component: SectionHeading,
    args: { title: "Publicaciones recientes" },
};

export default meta;

type Story = StoryObj<typeof SectionHeading>;

export const TitleOnly: Story = {};

export const WithKicker: Story = { args: { kicker: "Archivo" } };

export const WithLink: Story = {
    args: { kicker: "Archivo", action: { label: "Ver todas", to: "#" } },
};
