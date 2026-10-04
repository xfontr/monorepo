import type { Meta, StoryObj } from "@storybook/vue3-vite";

import FilterPills from "./FilterPills.vue";

const meta: Meta<typeof FilterPills> = {
    component: FilterPills,
    args: {
        label: "Formato",
        items: [
            { label: "Todo", to: "#", count: 29, active: true },
            { label: "Artículos", to: "#", count: 17 },
            { label: "Ensayos", to: "#", count: 6 },
            { label: "TFG y TFM", to: "#", count: 4 },
            { label: "Comentarios de jurisprudencia", to: "#", count: 2 },
        ],
    },
};

export default meta;

type Story = StoryObj<typeof FilterPills>;

export const AllActive: Story = {};

export const FormatActive: Story = {
    args: {
        items: [
            { label: "Todo", to: "#", count: 29 },
            { label: "Artículos", to: "#", count: 17, active: true },
            { label: "Ensayos", to: "#", count: 6 },
        ],
    },
};
