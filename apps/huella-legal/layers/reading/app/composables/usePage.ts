export const usePage = async () => {
    const route = useRoute("article");

    const request = useCachedFetch<Page>(`/api/pages/${route.params.slug}`);
    const { data: page } = request;

    useSeoMeta({
        title: () => page.value?.seo?.title ?? page.value?.title,
        description: () => page.value?.seo?.description,
        robots: () => (page.value?.seo?.noindex ? "noindex" : undefined),
    });

    useSeoTitleTemplate(() => page.value?.seo?.title);

    await useFailOnError(request);

    return { page };
};
