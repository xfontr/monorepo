import type { Meta, StoryObj } from "@storybook/vue3-vite";

import SubjectsFormats from "./Formats.vue";

const meta: Meta<typeof SubjectsFormats> = {
    component: SubjectsFormats,
    args: {
        formats: [
            { value: "articulo", count: 61 },
            { value: "comentario", count: 18 },
            { value: "tfg-tfm", count: 12 },
        ],
    },
};

export default meta;

type Story = StoryObj<typeof SubjectsFormats>;

export const Default: Story = {};
