import type { Meta, StoryObj } from "@storybook/vue3-vite";

import PublishReasons from "./PublishReasons.vue";

const meta: Meta<typeof PublishReasons> = {
    component: PublishReasons,
};

export default meta;

type Story = StoryObj<typeof PublishReasons>;

export const Default: Story = {};
