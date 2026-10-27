import type { Meta, StoryObj } from "@storybook/vue3-vite";

import PublishProposal from "./PublishProposal.vue";

const meta: Meta<typeof PublishProposal> = {
    component: PublishProposal,
};

export default meta;

type Story = StoryObj<typeof PublishProposal>;

export const Default: Story = {};
