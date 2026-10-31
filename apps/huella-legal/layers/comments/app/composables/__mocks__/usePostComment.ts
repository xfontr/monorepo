import { fn } from "storybook/test";
import { readonly, ref } from "vue";
import type {
    PostCommentFailure,
    PostCommentStatus,
    usePostComment as useRealPostComment,
} from "../usePostComment";

export type { PostCommentFailure, PostCommentStatus } from "../usePostComment";

/** A controller held in `status`, so a story shows one state and never sends a request. */
export const postCommentIn = (
    status: PostCommentStatus,
    failure?: PostCommentFailure,
): ReturnType<typeof useRealPostComment> => ({
    status: readonly(ref(status)),
    errors: readonly(ref([])),
    failure: readonly(ref(failure)),
    send: fn(),
});

export const usePostComment = fn(() => postCommentIn("idle"));
