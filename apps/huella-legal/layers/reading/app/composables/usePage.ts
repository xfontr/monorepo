export const usePage = async () => {
    const route = useRoute("article");

    const request = useCachedFetch<Page>(`/api/pages/${route.params.slug}`);
    const { data: page } = request;

    useSeoMeta({
        title: () => page.value?.seo?.title ?? page.value?.title,
        description: () => page.value?.seo?.description,
        ogTitle: () => page.value?.seo?.title ?? page.value?.title,
        ogDescription: () => page.value?.seo?.description,
        ogType: "website",
        ogUrl: () => page.value?.permalink,
        robots: () => (page.value?.seo?.noindex ? "noindex" : undefined),
    });

    await useFailOnError(request);

    return { page };
};
