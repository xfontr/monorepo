import type { Meta, StoryObj } from "@storybook/vue3-vite";

import FormReplyNotice from "./FormReplyNotice.vue";

const meta: Meta<typeof FormReplyNotice> = {
    component: FormReplyNotice,
};

export default meta;

type Story = StoryObj<typeof FormReplyNotice>;

export const Slow: Story = {};
