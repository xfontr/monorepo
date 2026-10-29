import { refDebounced } from "@vueuse/core";
import type { Ref } from "vue";

const DEBOUNCE_MS = 250;

export const useSearchPreview = (term: Ref<string>) => {
    const trimmed = computed<string>(() => term.value.trim());
    const query = refDebounced(trimmed, DEBOUNCE_MS);

    const { data: home } = useCachedFetch<Home>("/api/home");
    const { data: search, status } = useCachedFetch<ArticleSearch>("/api/search", {
        query: computed(() => ({ query: query.value })),
        enabled: () => query.value !== "",
    });

    const pending = computed<boolean>(
        () => trimmed.value !== query.value || (query.value !== "" && status.value === "pending"),
    );

    return { home, search, pending };
};
