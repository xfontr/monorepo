// Nuxt's default reuses fetched data only while hydrating or from a prerendered payload
export const useCachedFetch = createUseFetch({
    getCachedData: (key, nuxtApp, { cause }) =>
        cause === "refresh:manual" || cause === "refresh:hook"
            ? undefined
            : (nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]),
});
