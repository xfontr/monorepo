import { useLocalStorage } from "@vueuse/core";
import * as v from "valibot";
import { interestEntrySchema } from "../schemas/interestEntry";
import type { InterestEntry } from "../types/InterestEntry";

const STORAGE_KEY = "huella-legal:interest-history";

/** The history table's rows, kept in this browser's local storage. */
export const useInterestHistory = () => {
    // Read after mount, since the page is prerendered with an empty table and must hydrate as one
    const stored = useLocalStorage<unknown>(STORAGE_KEY, [], { initOnMounted: true });

    const entries = computed<InterestEntry[]>(() =>
        Array.isArray(stored.value)
            ? stored.value.filter((entry) => v.is(interestEntrySchema, entry))
            : [],
    );

    const add = (entry: Omit<InterestEntry, "id">): void => {
        stored.value = [...entries.value, { ...entry, id: crypto.randomUUID() }];
    };

    const rename = (id: string, concept: string): void => {
        stored.value = entries.value.map((entry) =>
            entry.id === id ? { ...entry, concept: concept.trim() } : entry,
        );
    };

    const remove = (id: string): void => {
        stored.value = entries.value.filter((entry) => entry.id !== id);
    };

    const clear = (): void => {
        stored.value = [];
    };

    return { entries, add, rename, remove, clear };
};
