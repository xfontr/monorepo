import type { Meta, StoryObj } from "@storybook/vue3-vite";

import SortSelect from "./SortSelect.vue";

const meta: Meta<typeof SortSelect> = {
    component: SortSelect,
    args: { modelValue: "newest" },
};

export default meta;

type Story = StoryObj<typeof SortSelect>;

export const Newest: Story = {};

export const Oldest: Story = { args: { modelValue: "oldest" } };
