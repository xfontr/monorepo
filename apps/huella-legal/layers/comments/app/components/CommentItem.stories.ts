import type { Meta, StoryObj } from "@storybook/vue3-vite";
import CommentItem from "./CommentItem.vue";

const meta: Meta<typeof CommentItem> = {
    component: CommentItem,
    args: {
        comment: {
            id: "12",
            author: "Lucía Pérez Gil",
            publishedAt: "2024-03-12T09:00:00Z",
            paragraphs: [
                "Muy buen artículo. Me ha servido para preparar el examen de Derecho penal.",
                "¿Tenéis algo parecido sobre la imprudencia?",
            ],
        },
        replyable: true,
    },
};

export default meta;

type Story = StoryObj<typeof CommentItem>;

export const TopLevel: Story = {};

export const NestedReply: Story = {
    args: {
        comment: {
            id: "13",
            author: "Ana de la Torre",
            publishedAt: "2024-03-13T09:00:00Z",
            paragraphs: ["Sí, en el área de Derecho penal hay dos."],
            replyTo: "Luis Martín",
        },
    },
};

export const Closed: Story = { args: { replyable: false } };
