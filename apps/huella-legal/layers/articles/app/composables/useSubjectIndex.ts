export const useSubjectIndex = async () => {
    const { data: index, error } = await useFetch<SubjectIndex>("/api/subjects");

    if (error.value) throw createPageError(error.value);

    return { index };
};
