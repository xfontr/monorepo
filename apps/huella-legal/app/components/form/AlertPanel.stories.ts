import type { Meta, StoryObj } from "@storybook/vue3-vite";

import AlertPanel from "./AlertPanel.vue";

const meta: Meta<typeof AlertPanel> = {
    component: AlertPanel,
    args: { title: "No hemos podido enviar tu propuesta" },
    render: (args) => ({
        components: { AlertPanel },
        setup: () => ({ args }),
        template: "<AlertPanel v-bind=\"args\">El problema es nuestro, no de tu formulario: todo lo que has escrito sigue aquí. Inténtalo de nuevo en unos minutos.</AlertPanel>",
    }),
};

export default meta;

type Story = StoryObj<typeof AlertPanel>;

export const ServerError: Story = {};

export const CustomIcon: Story = { args: { title: "El archivo supera el tamaño máximo", icon: "i-lucide-file-x" } };
