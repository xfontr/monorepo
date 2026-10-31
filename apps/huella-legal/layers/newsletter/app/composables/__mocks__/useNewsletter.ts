import type { FormPostStatus } from "#layers/forms/app/composables/useFormPost";
import { fn } from "storybook/test";
import { readonly, ref } from "vue";
import type { useNewsletter as useRealNewsletter } from "../useNewsletter";

/** A controller held in `status`, so a story shows one state and never sends a request. */
export const newsletterIn = (status: FormPostStatus): ReturnType<typeof useRealNewsletter> => ({
    status: readonly(ref(status)),
    errors: readonly(ref([])),
    failure: readonly(ref()),
    send: fn(),
});

export const useNewsletter = fn(() => newsletterIn("idle"));
