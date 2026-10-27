import type { Meta, StoryObj } from "@storybook/vue3-vite";

import FilterPills from "./FilterPills.vue";

const meta: Meta<typeof FilterPills> = {
    component: FilterPills,
    args: {
        label: "Formato",
        items: [
            { label: "Todo", to: "#", count: 29, active: true },
            { label: "Artículos", to: "#", count: 17 },
            { label: "Comentarios", to: "#", count: 8 },
            { label: "TFG y TFM", to: "#", count: 4 },
        ],
    },
};

export default meta;

type Story = StoryObj<typeof FilterPills>;

export const AllFormats: Story = {};

export const FormatActive: Story = {
    args: {
        items: [
            { label: "Todo", to: "#", count: 29 },
            { label: "Artículos", to: "#", count: 17, active: true },
            { label: "Comentarios", to: "#", count: 8 },
        ],
    },
};
