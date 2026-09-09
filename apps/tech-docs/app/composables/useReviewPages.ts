/** `README.md`, `TEMPLATE.md` and `SCORECARDS.md` share the directory but aren't reviews — filtered out by the dated-filename pattern below. */
export function useReviewPages() {
    return useAsyncData("reviews", () =>
        queryCollection("docs")
            .where("path", "LIKE", "/docs/reviews/%")
            .select("path", "title", "description")
            .order("path", "DESC")
            .all(), {
        default: () => [],
        transform: (pages) => pages.filter((page) => /\/docs\/reviews\/\d{4}-/.test(page.path)),
    });
}
