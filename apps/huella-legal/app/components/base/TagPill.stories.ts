import type { Meta, StoryObj } from "@storybook/vue3-vite";

import TagPill from "./TagPill.vue";

const meta: Meta<typeof TagPill> = {
    component: TagPill,
    args: { label: "Derecho penal", to: "#" },
};

export default meta;

type Story = StoryObj<typeof TagPill>;

export const Idle: Story = {};

export const WithCount: Story = { args: { count: 24 } };

export const Active: Story = { args: { count: 24, active: true } };

export const LongLabel: Story = { args: { label: "Derecho internacional público y relaciones internacionales" } };
