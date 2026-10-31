import type { FormPostStatus } from "#layers/forms/app/composables/useFormPost";
import { fn } from "storybook/test";
import { readonly, ref } from "vue";
import type { PostCommentFailure, usePostComment as useRealPostComment } from "../usePostComment";

export type { PostCommentFailure } from "../usePostComment";

/** A controller held in `status`, so a story shows one state and never sends a request. */
export const postCommentIn = (
    status: FormPostStatus,
    failure?: PostCommentFailure,
): ReturnType<typeof useRealPostComment> => ({
    status: readonly(ref(status)),
    errors: readonly(ref([])),
    failure: readonly(ref(failure)),
    send: fn(),
});

export const usePostComment = fn(() => postCommentIn("idle"));
