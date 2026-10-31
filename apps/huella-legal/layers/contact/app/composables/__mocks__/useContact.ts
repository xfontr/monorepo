import type { FormPostStatus } from "#layers/forms/app/composables/useFormPost";
import { fn } from "storybook/test";
import { readonly, ref } from "vue";
import type { useContact as useRealContact } from "../useContact";

/** A controller held in `status`, so a story shows one state and never sends a request. */
export const contactIn = (status: FormPostStatus): ReturnType<typeof useRealContact> => ({
    status: readonly(ref(status)),
    errors: readonly(ref([])),
    failure: readonly(ref()),
    send: fn(),
});

export const useContact = fn(() => contactIn("idle"));
