import type { FormPostStatus } from "#layers/forms/app/composables/useFormPost";
import { fn } from "storybook/test";
import { readonly, ref } from "vue";
import type { useSubmission as useRealSubmission } from "../useSubmission";

/** A controller held in `status`, so a story shows one state and never sends a request. */
export const submissionIn = (status: FormPostStatus): ReturnType<typeof useRealSubmission> => ({
    status: readonly(ref(status)),
    errors: readonly(ref([])),
    failure: readonly(ref()),
    send: fn(),
});

export const useSubmission = fn(() => submissionIn("idle"));
