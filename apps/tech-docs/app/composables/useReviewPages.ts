/**
 * Reviews are markdown under `docs/reviews/`, written by the `repo-review` skill and read here in
 * place. `README.md`, `TEMPLATE.md` and `SCORECARDS.md` live in the same directory and are the
 * furniture around them, so the dated filename is what tells a review from its neighbours.
 */
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
