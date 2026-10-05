import type { Meta, StoryObj } from "@storybook/vue3-vite";

import FormErrorSummary from "./FormErrorSummary.vue";

const meta: Meta<typeof FormErrorSummary> = {
    component: FormErrorSummary,
    args: {
        errors: [
            { id: "email", label: "Correo electrónico", message: "falta el dominio." },
            { id: "resumen", label: "Resumen", message: "es obligatorio." },
        ],
    },
};

export default meta;

type Story = StoryObj<typeof FormErrorSummary>;

export const TwoFields: Story = {};

export const OneField: Story = { args: { errors: [{ id: "email", label: "Correo electrónico", message: "falta el dominio." }] } };
