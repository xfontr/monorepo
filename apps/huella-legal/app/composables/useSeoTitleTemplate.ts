/** Keeps the site's title template off a title the CMS already signs with the site's name. */
export const useSeoTitleTemplate = (seoTitle: () => string | undefined) => {
    useHead({
        titleTemplate: (title) => (seoTitle() ? (title ?? null) : `${title} %separator %siteName`),
    });
};
