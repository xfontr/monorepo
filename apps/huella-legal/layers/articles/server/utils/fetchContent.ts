// The content route already settled its status and a client-safe message, so both pass through
export async function fetchContent<T>(path: string, query?: Record<string, unknown>): Promise<T> {
    try {
        return await $fetch<T>(path, { query });
    }
    catch (cause) {
        const response = (cause as { response?: Response }).response;

        throw createError(response
            ? { statusCode: response.status, statusMessage: response.statusText, cause }
            : { statusCode: 502, statusMessage: "Content unavailable", cause });
    }
}
