import type { LocationQueryRaw, RouteLocationRaw } from "vue-router";

export const useListingQuery = (defaults: Record<string, string>) => {
    const route = useRoute();
    const router = useRouter();

    const link = (patch: LocationQueryRaw): RouteLocationRaw => ({
        query: Object.fromEntries(
            Object.entries({ ...route.query, page: undefined, ...patch }).filter(
                ([name, value]) => value !== defaults[name],
            ),
        ),
    });

    const navigate = (patch: LocationQueryRaw) => router.push(link(patch));

    return { link, navigate };
};
