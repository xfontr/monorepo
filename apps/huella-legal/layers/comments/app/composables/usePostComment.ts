import type { CommentError } from "../../shared/schemas/comment";
import type { CommentRequest } from "../../shared/types/CommentRequest";

export type PostCommentStatus = "idle" | "submitting" | "success" | "invalid" | "error";

export type PostCommentFailure = "closed" | "duplicate" | "flood" | "unavailable";

const FAILURES: Partial<Record<number, PostCommentFailure>> = {
    409: "duplicate",
    410: "closed",
    429: "flood",
};

interface RejectedComment {
    statusCode?: number;
    data?: { data?: CommentError[] };
}

export const usePostComment = () => {
    const status = ref<PostCommentStatus>("idle");
    const errors = ref<CommentError[]>([]);
    const failure = ref<PostCommentFailure>();

    const fail = ({ statusCode, data }: RejectedComment) => {
        errors.value = statusCode === 422 ? (data?.data ?? []) : [];

        if (errors.value.length) {
            status.value = "invalid";
            return;
        }

        failure.value = FAILURES[statusCode ?? 0] ?? "unavailable";
        status.value = "error";
    };

    const send = async (fields: Omit<CommentRequest, "token">, challenge: Challenge) => {
        if (status.value === "submitting") return;

        status.value = "submitting";
        errors.value = [];
        failure.value = undefined;

        try {
            await challenge((token) =>
                $fetch("/api/comments", {
                    method: "POST",
                    body: { ...fields, token } satisfies CommentRequest,
                }),
            );
            status.value = "success";
        } catch (error) {
            fail(error as RejectedComment);
        }
    };

    return {
        status: readonly(status),
        errors: readonly(errors),
        failure: readonly(failure),
        send,
    };
};
