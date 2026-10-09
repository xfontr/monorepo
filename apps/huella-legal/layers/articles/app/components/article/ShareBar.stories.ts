import type { Meta, StoryObj } from "@storybook/vue3-vite";

import ArticleShareBar from "./ShareBar.vue";

const meta: Meta<typeof ArticleShareBar> = {
    component: ArticleShareBar,
    args: { title: "La teoría jurídica del delito", url: "https://huellalegal.test/la-teoria-juridica-del-delito", citeTo: "#citar" },
};

export default meta;

type Story = StoryObj<typeof ArticleShareBar>;

export const WithCitation: Story = {};

export const WithoutCitation: Story = { args: { citeTo: undefined } };
