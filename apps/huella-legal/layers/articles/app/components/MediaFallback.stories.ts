import type { Meta, StoryObj } from "@storybook/vue3-vite";

import MediaFallback from "./MediaFallback.vue";

const meta: Meta<typeof MediaFallback> = {
    component: MediaFallback,
    argTypes: {
        tone: { control: "inline-radio", options: ["paper", "slate"] },
    },
    decorators: [() => ({ template: '<div class="@container aspect-[3/2] w-80"><story /></div>' })],
};

export default meta;

type Story = StoryObj<typeof MediaFallback>;

export const Paper: Story = {};

export const PaperWithLabel: Story = { args: { label: "Imagen del artículo" } };

export const Slate: Story = { args: { tone: "slate" } };

export const SlateWithLabel: Story = { args: { tone: "slate", label: "Imagen del artículo" } };
