export const useSubjectIndex = async () => {
    const request = useCachedFetch<SubjectIndex>("/api/subjects");

    await useFailOnError(request);

    return { index: request.data };
};
