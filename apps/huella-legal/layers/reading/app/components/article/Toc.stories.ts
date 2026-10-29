import type { Meta, StoryObj } from "@storybook/vue3-vite";

import ArticleToc from "./Toc.vue";

const TOC = [
    { id: "introduccion", label: "Introducción", level: 2 },
    { id: "accion", label: "La acción como punto de partida", level: 2 },
    { id: "causalismo", label: "Causalismo y finalismo", level: 3 },
    { id: "tipicidad", label: "Tipicidad", level: 2 },
    { id: "antijuridicidad", label: "Antijuridicidad y causas de justificación", level: 2 },
    { id: "culpabilidad", label: "Culpabilidad", level: 2 },
] as const;

const meta: Meta<typeof ArticleToc> = {
    component: ArticleToc,
    args: { items: [...TOC] },
};

export default meta;

type Story = StoryObj<typeof ArticleToc>;

export const Idle: Story = {};
