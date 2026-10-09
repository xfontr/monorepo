import type { NuxtError } from "#app";

export function createPageError(error: NuxtError): NuxtError {
    const status = (error.cause as { response?: { status?: number } } | undefined)?.response
        ?.status;

    return createError({
        status: status ?? 502,
        statusText: error.statusText,
        message: error.message,
        data: error.data,
        stack: error.stack,
        cause: error,
        fatal: true,
    });
}
