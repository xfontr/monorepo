import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick, ref, type Ref } from "vue";
import { useSearchPreview } from "./useSearchPreview";

const fetching = vi.hoisted(() => ({
    urls: [] as string[],
    query: undefined as Ref<Record<string, unknown>> | undefined,
    enabled: undefined as (() => boolean) | undefined,
    status: undefined as Ref<string> | undefined,
}));

mockNuxtImport(
    "useCachedFetch",
    () =>
        (
            url: string,
            options?: { query: Ref<Record<string, unknown>>; enabled: () => boolean },
        ) => {
            fetching.urls.push(url);

            if (options) {
                fetching.query = options.query;
                fetching.enabled = options.enabled;
            }

            fetching.status = ref("success");

            return { data: ref(undefined), status: fetching.status };
        },
);

const previewOf = async (term: Ref<string>) => {
    let preview!: ReturnType<typeof useSearchPreview>;

    await mountSuspended(
        defineComponent({
            setup: () => {
                preview = useSearchPreview(term);

                return () => null;
            },
        }),
    );

    return preview;
};

beforeEach(() => {
    fetching.urls = [];
    vi.useRealTimers();
});

describe("useSearchPreview", () => {
    it("asks for the home payload too, since that is what fills the palette before any typing", async () => {
        await previewOf(ref(""));

        expect(fetching.urls).toEqual(["/api/home", "/api/search"]);
    });

    it("never searches for a blank term, which the route would answer with a 404", async () => {
        await previewOf(ref("   "));

        expect(fetching.enabled?.()).toBe(false);
    });

    it("searches only once typing pauses, so each keystroke is not a WordPress request", async () => {
        vi.useFakeTimers();
        const term = ref("");
        const preview = await previewOf(term);

        term.value = "dol";
        await nextTick();
        term.value = " dolo ";
        await nextTick();

        expect(fetching.query?.value).toEqual({ query: "" });
        expect(preview.pending.value).toBe(true);

        vi.advanceTimersByTime(250);
        await nextTick();

        expect(fetching.query?.value).toEqual({ query: "dolo" });
        expect(fetching.enabled?.()).toBe(true);
        expect(preview.pending.value).toBe(false);
    });

    it("stays pending while the search is in flight, so stale matches are not taken as current", async () => {
        vi.useFakeTimers();
        const term = ref("");
        const preview = await previewOf(term);

        term.value = "dolo";
        vi.advanceTimersByTime(250);
        await nextTick();
        fetching.status!.value = "pending";

        expect(preview.pending.value).toBe(true);
    });
});
