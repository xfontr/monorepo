import { useFormPost } from "#layers/forms/app/composables/useFormPost";
import type { CommentError } from "../../shared/schemas/comment";
import type { CommentRequest } from "../../shared/types/CommentRequest";

export type PostCommentFailure = "closed" | "duplicate" | "flood" | "unavailable";

const FAILURES: Partial<Record<number, PostCommentFailure>> = {
    409: "duplicate",
    410: "closed",
    429: "flood",
};

export const usePostComment = () =>
    useFormPost<CommentRequest, CommentError, PostCommentFailure>("/api/comments", {
        failures: FAILURES,
    });
