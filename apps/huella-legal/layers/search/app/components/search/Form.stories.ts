import type { Meta, StoryObj } from "@storybook/vue3-vite";

import SearchForm from "./Form.vue";

const meta: Meta<typeof SearchForm> = {
    component: SearchForm,
    args: { modelValue: "" },
};

export default meta;

type Story = StoryObj<typeof SearchForm>;

export const Empty: Story = {};

export const Filled: Story = { args: { modelValue: "culpabilidad" } };

export const Labelled: Story = {
    args: { label: "Buscar en el archivo", placeholder: "Título, autor o tema" },
};
