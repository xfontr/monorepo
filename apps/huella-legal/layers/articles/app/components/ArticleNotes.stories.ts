import type { Meta, StoryObj } from "@storybook/vue3-vite";

import ArticleNotes from "./ArticleNotes.vue";

const meta: Meta<typeof ArticleNotes> = {
    component: ArticleNotes,
    args: {
        notes: [
            { id: "1", html: "Art. 10 del Código Penal." },
            { id: "2", html: "Welzel, H., <em>Das neue Bild des Strafrechtssystems</em>, 1961." },
            { id: "12", html: "Una nota de dos dígitos, para comprobar que el número no empuja el texto." },
        ],
    },
};

export default meta;

type Story = StoryObj<typeof ArticleNotes>;

export const Notes: Story = {};
