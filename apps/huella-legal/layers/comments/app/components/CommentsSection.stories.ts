import type { Meta, StoryObj } from "@storybook/vue3-vite";
import CommentsSection from "./CommentsSection.vue";

const comment = (id: string, author: string, text: string): ReaderComment => ({
    id,
    author,
    publishedAt: `2024-03-1${id}T09:00:00Z`,
    paragraphs: [text],
});

const meta: Meta<typeof CommentsSection> = {
    component: CommentsSection,
    args: {
        article: { id: "42" },
        comments: {
            open: true,
            count: 4,
            threads: [
                {
                    ...comment("1", "Lucía Pérez", "Muy buen artículo, me ha aclarado el dolo."),
                    replies: [
                        comment("2", "Ana de la Torre", "Gracias, Lucía."),
                        {
                            ...comment("3", "Lucía Pérez", "¿Habrá una segunda parte?"),
                            replyTo: "Ana de la Torre",
                        },
                    ],
                },
                { ...comment("4", "Luis Martín", "Echo en falta la jurisprudencia."), replies: [] },
            ],
        },
    },
};

export default meta;

type Story = StoryObj<typeof CommentsSection>;

export const Threads: Story = {};

export const Empty: Story = { args: { comments: { open: true, count: 0, threads: [] } } };

export const Closed: Story = {
    args: { comments: { ...meta.args!.comments!, open: false } },
};

export const Loading: Story = { args: { comments: undefined } };

export const Sortable: Story = {
    args: {
        comments: {
            open: true,
            count: 6,
            threads: ["1", "2", "3", "4", "5", "6"].map((id) => ({
                ...comment(id, `Lector ${id}`, "Un comentario sobre el artículo."),
                replies: [],
            })),
        },
    },
};
