import { fn } from "storybook/test";
import { readonly, ref } from "vue";
import type { NewsletterStatus, useNewsletter as useRealNewsletter } from "../useNewsletter";

export type { NewsletterStatus } from "../useNewsletter";

/** A controller held in `status`, so a story shows one state and never sends a request. */
export const newsletterIn = (status: NewsletterStatus): ReturnType<typeof useRealNewsletter> => ({
    status: readonly(ref(status)),
    errors: readonly(ref([])),
    subscribe: fn(),
});

export const useNewsletter = fn(() => newsletterIn("idle"));
