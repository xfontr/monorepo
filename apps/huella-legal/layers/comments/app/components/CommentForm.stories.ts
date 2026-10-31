import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, mocked } from "storybook/test";

import {
    postCommentIn,
    type PostCommentFailure,
    type PostCommentStatus,
} from "../composables/__mocks__/usePostComment";
import { usePostComment } from "../composables/usePostComment";
import CommentForm from "./CommentForm.vue";

const meta: Meta<typeof CommentForm> = {
    component: CommentForm,
    args: { postId: "42" },
};

export default meta;

type Story = StoryObj<typeof CommentForm>;

const holding = (status: PostCommentStatus, failure?: PostCommentFailure): Story => ({
    beforeEach: () => {
        mocked(usePostComment).mockImplementation(() => postCommentIn(status, failure));
    },
});

export const Idle: Story = {};

export const Replying: Story = {
    args: {
        replyTo: {
            id: "9",
            author: "Ana de la Torre",
            publishedAt: "2024-03-12T09:00:00Z",
            paragraphs: [],
        },
    },
};

export const Submitting: Story = holding("submitting");

// Field errors only reach the fields through a submit, which an empty form fails before any request
export const Invalid: Story = {
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(canvas.getByRole("button", { name: "Enviar comentario" }));

        await expect(canvas.getByRole("textbox", { name: /Comentario/ })).toHaveAttribute(
            "aria-invalid",
            "true",
        );
    },
};

export const Duplicate: Story = holding("error", "duplicate");

export const Failed: Story = holding("error", "unavailable");

export const Success: Story = holding("success");
