import type { Meta, StoryObj } from "@storybook/vue3-vite";
import CommentThread from "./CommentThread.vue";

const comment = (id: string, author: string, text: string): ReaderComment => ({
    id,
    author,
    publishedAt: `2024-03-1${id}T09:00:00Z`,
    paragraphs: [text],
});

const meta: Meta<typeof CommentThread> = {
    component: CommentThread,
    args: {
        thread: {
            ...comment("1", "Lucía Pérez", "Muy buen artículo, me ha aclarado el dolo."),
            replies: [
                comment("2", "Ana de la Torre", "Gracias, Lucía."),
                {
                    ...comment("3", "Lucía Pérez", "¿Habrá una segunda parte?"),
                    replyTo: "Ana de la Torre",
                },
            ],
        },
        replyable: true,
    },
};

export default meta;

type Story = StoryObj<typeof CommentThread>;

export const WithReplies: Story = {};

export const Unanswered: Story = {
    args: { thread: { ...meta.args!.thread!, replies: [] } },
};

export const Closed: Story = { args: { replyable: false } };
