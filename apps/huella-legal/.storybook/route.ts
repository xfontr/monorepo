/** Stories mount without a router, so components that read the route see an empty query. */
export function useRoute(): { query: Record<string, string> } {
    return { query: {} };
}
