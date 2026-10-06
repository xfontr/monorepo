import type { Meta, StoryObj } from "@storybook/vue3-vite";

import Pagination from "./Pagination.vue";

const meta: Meta<typeof Pagination> = {
    component: Pagination,
    args: { page: 1, total: 48, perPage: 7, to: (page: number) => ({ query: { page } }) },
};

export default meta;

type Story = StoryObj<typeof Pagination>;

export const FirstPage: Story = {};

export const MiddlePage: Story = { args: { page: 4, total: 140 } };

export const LastPage: Story = { args: { page: 7 } };

export const SinglePage: Story = { args: { total: 5 } };
