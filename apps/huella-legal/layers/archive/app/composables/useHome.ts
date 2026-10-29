export const useHome = async () => {
    const request = useCachedFetch<Home>("/api/home");

    await useFailOnError(request);

    return { home: request.data };
};
