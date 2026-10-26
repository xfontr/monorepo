import type { Meta, StoryObj } from "@storybook/vue3-vite";

import NewsletterCard from "./NewsletterCard.vue";

const meta: Meta<typeof NewsletterCard> = {
    component: NewsletterCard,
};

export default meta;

type Story = StoryObj<typeof NewsletterCard>;

export const Default: Story = {};

export const Subject: Story = { args: { subject: "derecho penal" } };
