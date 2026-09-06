import { buildWiki } from "../../shared/wiki.ts";

/**
 * The wiki's shape, derived from the paths the collection found rather than written down. Built
 * once per session under one key: every doc page renders the same nav, and re-deriving it per
 * navigation would rebuild the tree on each click.
 */
export function useWiki() {
    return useAsyncData("wiki", async () =>
        buildWiki(await queryCollection("docs").select("path", "title").all()), { default: () => [] });
}
