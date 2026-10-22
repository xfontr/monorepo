import type { Meta, StoryObj } from "@storybook/vue3-vite";

import NewsletterBand from "./NewsletterBand.vue";

const meta: Meta<typeof NewsletterBand> = {
    component: NewsletterBand,
};

export default meta;

type Story = StoryObj<typeof NewsletterBand>;

export const Paper: Story = {};

export const Slate: Story = { args: { tone: "slate" } };
