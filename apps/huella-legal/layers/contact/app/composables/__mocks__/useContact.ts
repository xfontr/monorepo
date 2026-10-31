import { fn } from "storybook/test";
import { readonly, ref } from "vue";
import type { ContactStatus, useContact as useRealContact } from "../useContact";

export type { ContactStatus } from "../useContact";

/** A controller held in `status`, so a story shows one state and never sends a request. */
export const contactIn = (status: ContactStatus): ReturnType<typeof useRealContact> => ({
    status: readonly(ref(status)),
    errors: readonly(ref([])),
    send: fn(),
});

export const useContact = fn(() => contactIn("idle"));
