import type { Meta, StoryObj } from "@storybook/vue3-vite";

import Kicker from "./Kicker.vue";

const meta: Meta<typeof Kicker> = {
    component: Kicker,
    render: (args) => ({
        components: { Kicker },
        setup: () => ({ args }),
        template: "<Kicker v-bind=\"args\">Derecho penal</Kicker>",
    }),
};

export default meta;

type Story = StoryObj<typeof Kicker>;

export const Teal: Story = {};

export const Muted: Story = { args: { tone: "muted" } };

export const Link: Story = { args: { href: "#" } };
