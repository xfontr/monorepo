import type { AsyncData, NuxtError } from "#app";

export const useFailOnError = async (
    request: AsyncData<unknown, NuxtError | undefined>,
    { refetches = false } = {},
) => {
    if (refetches) {
        watch(request.error, (value) => {
            if (!value) return;
            showError(createPageError(value));
        });
    }

    const { error } = await request;

    if (error.value) throw createPageError(error.value);
};
