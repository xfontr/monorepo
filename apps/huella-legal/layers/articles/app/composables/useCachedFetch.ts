// Nuxt's default reuses fetched data only while hydrating, so each client navigation would refetch
export const useCachedFetch = createUseFetch({
    getCachedData: (key, nuxtApp, { cause }) =>
        cause === "refresh:manual" || cause === "refresh:hook"
            ? undefined
            : (nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]),
});
