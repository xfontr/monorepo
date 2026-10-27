export const useAuthorDirectory = async () => {
    const { data: authors, error } = await useCachedFetch<Facet<Author>[]>("/api/authors", {
        default: () => [],
    });

    if (error.value) throw createPageError(error.value);

    return { authors };
};
