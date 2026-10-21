import type { Meta, StoryObj } from "@storybook/vue3-vite";

import FormSuccessPanel from "./FormSuccessPanel.vue";

const meta: Meta<typeof FormSuccessPanel> = {
    component: FormSuccessPanel,
    args: {
        title: "Recibido. Gracias, María-José.",
        action: { label: "Enviar otra propuesta", to: "#" },
    },
    render: (args) => ({
        components: { FormSuccessPanel },
        setup: () => ({ args }),
        template:
            '<FormSuccessPanel v-bind="args">Te confirmaremos la recepción en 24–72 horas, y tendrás una decisión razonada en cinco días como máximo.</FormSuccessPanel>',
    }),
};

export default meta;

type Story = StoryObj<typeof FormSuccessPanel>;

export const WithAction: Story = {};

export const TitleOnly: Story = { args: { action: undefined } };
