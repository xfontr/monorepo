import type { Meta, StoryObj } from "@storybook/vue3-vite";

import AboutCallToAction from "./CallToAction.vue";

const meta: Meta<typeof AboutCallToAction> = {
    component: AboutCallToAction,
};

export default meta;

type Story = StoryObj<typeof AboutCallToAction>;

export const Default: Story = {};
