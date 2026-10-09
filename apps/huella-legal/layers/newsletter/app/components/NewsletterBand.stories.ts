import type { Meta, StoryObj } from "@storybook/vue3-vite";

import NewsletterBand from "./NewsletterBand.vue";

const meta: Meta<typeof NewsletterBand> = {
    component: NewsletterBand,
    args: { privacyTo: "#" },
};

export default meta;

type Story = StoryObj<typeof NewsletterBand>;

export const Paper: Story = {};

export const Slate: Story = { args: { tone: "slate" } };

export const Pending: Story = { args: { pending: true } };

export const SlateInvalid: Story = {
    args: { tone: "slate", error: "Falta el dominio: por ejemplo, lucia.martin@ejemplo.es" },
};
