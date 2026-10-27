import type { Meta, StoryObj } from "@storybook/vue3-vite";

import PublishThesis from "./PublishThesis.vue";

const meta: Meta<typeof PublishThesis> = {
    component: PublishThesis,
};

export default meta;

type Story = StoryObj<typeof PublishThesis>;

export const Default: Story = {};
