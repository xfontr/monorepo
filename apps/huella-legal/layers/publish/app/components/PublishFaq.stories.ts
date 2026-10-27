import type { Meta, StoryObj } from "@storybook/vue3-vite";

import PublishFaq from "./PublishFaq.vue";

const meta: Meta<typeof PublishFaq> = {
    component: PublishFaq,
};

export default meta;

type Story = StoryObj<typeof PublishFaq>;

export const Default: Story = {};
