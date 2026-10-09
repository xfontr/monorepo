import type { Meta, StoryObj } from "@storybook/vue3-vite";

import Kicker from "./Kicker.vue";

const meta: Meta<typeof Kicker> = {
    component: Kicker,
    render: (args) => ({
        components: { Kicker },
        setup: () => ({ args }),
        template: '<Kicker v-bind="args">Derecho penal</Kicker>',
    }),
};

export default meta;

type Story = StoryObj<typeof Kicker>;

export const Paper: Story = {};

export const Muted: Story = { args: { muted: true } };

export const Slate: Story = {
    args: { tone: "slate" },
    decorators: [() => ({ template: '<div class="bg-huella-slate-900 p-4"><story /></div>' })],
};

export const Link: Story = { args: { to: "#" } };
