import type { NuxtError } from "#app";

export const createPageError = (error: NuxtError): NuxtError => {
    const status =
        (error.cause as { response?: { status?: number } } | undefined)?.response?.status ?? 502;

    return createError({
        status,
        statusText: error.statusText,
        message: error.message,
        data: error.data,
        stack: error.stack,
        cause: error,
        // The server renders the error page either way, and Nitro logs every fatal error it serves
        fatal: import.meta.client || status >= 500,
    });
};
