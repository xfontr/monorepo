import type { Meta, StoryObj } from "@storybook/vue3-vite";

import Wordmark from "./Wordmark.vue";

const meta: Meta<typeof Wordmark> = {
    component: Wordmark,
    argTypes: {
        size: { control: "inline-radio", options: ["sm", "md"] },
        tone: { control: "inline-radio", options: ["paper", "slate"] },
    },
};

export default meta;

type Story = StoryObj<typeof Wordmark>;

export const Default: Story = {};

export const Small: Story = { args: { size: "sm" } };

export const WithTagline: Story = { args: { tagline: true } };

export const Slate: Story = {
    args: { tone: "slate", tagline: true },
    decorators: [() => ({ template: "<div class=\"inline-block bg-huella-slate-900 p-4\"><story /></div>" })],
};
