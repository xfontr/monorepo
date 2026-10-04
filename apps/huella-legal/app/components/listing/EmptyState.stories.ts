import type { Meta, StoryObj } from "@storybook/vue3-vite";

import EmptyState from "./EmptyState.vue";

const meta: Meta<typeof EmptyState> = {
    component: EmptyState,
    args: { subject: "Derecho administrativo", publishTo: "#", browseTo: "#" },
};

export default meta;

type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {};

export const LongSubject: Story = { args: { subject: "Derecho internacional público y relaciones internacionales" } };
