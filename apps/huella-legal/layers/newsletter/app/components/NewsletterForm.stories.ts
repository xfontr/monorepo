import type { Meta, StoryObj } from "@storybook/vue3-vite";

import NewsletterForm from "./NewsletterForm.vue";

const meta: Meta<typeof NewsletterForm> = {
    component: NewsletterForm,
};

export default meta;

type Story = StoryObj<typeof NewsletterForm>;

export const Stacked: Story = {};

export const Inline: Story = { args: { layout: "inline" } };

export const Pending: Story = { args: { email: "lucia.martin@ejemplo.es", pending: true } };

export const Invalid: Story = { args: { email: "lucia.martin@", error: "Falta el dominio: por ejemplo, lucia.martin@ejemplo.es" } };
