import type { Meta, StoryObj } from "@storybook/vue3-vite";

import ArticleTitle from "./Title.vue";

const meta: Meta<typeof ArticleTitle> = {
    component: ArticleTitle,
    args: {
        breadcrumb: [{ label: "Portada", to: "/" }, { label: "Aviso legal" }],
        title: "Aviso legal",
    },
};

export default meta;

type Story = StoryObj<typeof ArticleTitle>;

export const Bare: Story = {};
