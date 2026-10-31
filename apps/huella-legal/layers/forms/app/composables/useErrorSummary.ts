import type { FormErrorWithId } from "@nuxt/ui";
import type { FieldError } from "../types/FieldError";

export const useErrorSummary = (label: (field: string) => string) => {
    const errors = ref<FieldError[]>([]);

    const list = (formErrors: readonly FormErrorWithId[]): void => {
        errors.value = formErrors.flatMap(({ id, name, message }) =>
            id && name ? [{ id, label: label(name), message }] : [],
        );
    };

    return { errors: readonly(errors), list };
};
