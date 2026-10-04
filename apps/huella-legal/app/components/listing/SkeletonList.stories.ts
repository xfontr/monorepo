import type { Meta, StoryObj } from "@storybook/vue3-vite";

import SkeletonList from "./SkeletonList.vue";

const meta: Meta<typeof SkeletonList> = {
    component: SkeletonList,
};

export default meta;

type Story = StoryObj<typeof SkeletonList>;

export const Default: Story = {};

export const FiveRows: Story = { args: { rows: 5 } };

// The listing that swaps the skeleton for its results carries `aria-busy`, so it can flip back to false
export const InBusyListing: Story = {
    decorators: [() => ({ template: "<section aria-busy=\"true\" aria-label=\"Publicaciones\"><story /></section>" })],
};
