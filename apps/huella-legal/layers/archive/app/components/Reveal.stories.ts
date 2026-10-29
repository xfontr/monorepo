import type { Meta, StoryObj } from "@storybook/vue3-vite";

import Reveal from "./Reveal.vue";

interface Args {
    items: string[];
    limit: number;
    label: string;
}

// A generic component isn't a `ConcreteComponent`, so `Meta<typeof Reveal>` doesn't typecheck
const meta: Meta<Args> = {
    args: {
        items: Array.from({ length: 8 }, (_, index) => `Elemento ${index + 1}`),
        limit: 3,
        label: "Mostrar los 8 elementos",
    },
    render: (args) => ({
        components: { Reveal },
        setup: () => ({ args }),
        template: `
            <Reveal v-bind="args" v-slot="{ items }">
                <ul class="grid gap-2">
                    <li v-for="item in items" :key="item"><a href="#">{{ item }}</a></li>
                </ul>
            </Reveal>
        `,
    }),
};

export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const FitsOnePage: Story = {
    args: { limit: 8 },
};
