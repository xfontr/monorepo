import type { Meta, StoryObj } from "@storybook/vue3-vite";

import PublishSteps from "./PublishSteps.vue";

const meta: Meta<typeof PublishSteps> = {
    component: PublishSteps,
};

export default meta;

type Story = StoryObj<typeof PublishSteps>;

export const Default: Story = {};
