export const useAuthorDirectory = async () => {
    const request = useCachedFetch<Facet<Author>[]>("/api/authors", { default: () => [] });

    await useFailOnError(request);

    return { authors: request.data };
};
