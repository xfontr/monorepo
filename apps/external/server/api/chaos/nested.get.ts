export default defineEventHandler(async (event) => {
    // Absolute URL on purpose: a relative $fetch is handled in-process and never becomes an HTTP span.
    const { origin } = getRequestURL(event);

    const hops = await Promise.all([
        $fetch<{ slept: number }>(`${origin}/api/chaos/slow?ms=400`),
        $fetch<{ slept: number }>(`${origin}/api/chaos/slow?ms=900`),
    ]);

    return { hops };
});
