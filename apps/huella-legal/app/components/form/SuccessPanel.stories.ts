import type { Meta, StoryObj } from "@storybook/vue3-vite";

import SuccessPanel from "./SuccessPanel.vue";

const meta: Meta<typeof SuccessPanel> = {
    component: SuccessPanel,
    args: {
        title: "Recibido. Gracias, María-José.",
        action: { label: "Enviar otra propuesta", to: "#" },
    },
    render: (args) => ({
        components: { SuccessPanel },
        setup: () => ({ args }),
        template:
            '<SuccessPanel v-bind="args">Te confirmaremos la recepción en 24–72 horas, y tendrás una decisión razonada en cinco días como máximo.</SuccessPanel>',
    }),
};

export default meta;

type Story = StoryObj<typeof SuccessPanel>;

export const WithAction: Story = {};

export const TitleOnly: Story = { args: { action: undefined } };
