import type { Meta, StoryObj } from "@storybook/vue3-vite";

import ArticleBibliography from "./ArticleBibliography.vue";

const meta: Meta<typeof ArticleBibliography> = {
    component: ArticleBibliography,
    args: {
        entries: [
            "MIR PUIG, S., <em>Derecho penal. Parte general</em>, 10.ª ed., Reppertor, Barcelona, 2016.",
            "ROXIN, C., <em>Derecho penal. Parte general</em>, tomo I, Civitas, Madrid, 1997.",
            "Disponible en: <a href=\"#\">https://www.boe.es/buscar/act.php?id=BOE-A-1995-25444&amp;p=20230428&amp;tn=1</a>",
        ],
    },
};

export default meta;

type Story = StoryObj<typeof ArticleBibliography>;

export const Bibliography: Story = {};
