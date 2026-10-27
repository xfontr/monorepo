import { fakeAuthor } from "@monorepo/content/testing";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NuxtError } from "#app";
import { defineComponent, ref, type Ref } from "vue";
import type { Author } from "../../shared/types/Author";
import type { Facet } from "../../shared/types/Facet";
import { useAuthorDirectory } from "./useAuthorDirectory";

const AUTHORS: Facet<Author>[] = [{ value: fakeAuthor(), count: 2 }];

const nuxt = vi.hoisted(() => ({
    fetches: new Map<string, Record<string, unknown> | undefined>(),
    authors: undefined as unknown as Ref<Facet<Author>[]>,
    error: undefined as unknown as Ref<NuxtError | undefined>,
}));

mockNuxtImport("useCachedFetch", () => (url: string, options?: Record<string, unknown>) => {
    nuxt.fetches.set(url, options);

    const result = { data: nuxt.authors, error: nuxt.error };

    return Object.assign(Promise.resolve(result), result);
});

const setUp = async () => {
    let controller: Awaited<ReturnType<typeof useAuthorDirectory>> | undefined;
    let failure: unknown;

    await mountSuspended(
        defineComponent({
            setup: async () => {
                try {
                    controller = await useAuthorDirectory();
                } catch (error) {
                    failure = error;
                }

                return () => null;
            },
        }),
    );

    return { controller, failure };
};

beforeEach(() => {
    nuxt.fetches.clear();
    nuxt.authors = ref(AUTHORS);
    nuxt.error = ref();
});

describe("useAuthorDirectory", () => {
    // The article's author counts read the same route under their own key
    it("reads the whole authors route under its default key", async () => {
        const { controller } = await setUp();

        expect([...nuxt.fetches.keys()]).toEqual(["/api/authors"]);
        expect(nuxt.fetches.get("/api/authors")).not.toHaveProperty("key");
        expect(controller?.authors.value).toEqual(AUTHORS);
    });

    it("throws a fatal page error with the route's status when the directory can't be read", async () => {
        nuxt.error.value = createError(
            Object.assign(new Error("Bad gateway"), {
                statusCode: 502,
                statusMessage: "Bad gateway",
                response: { status: 502 },
            }),
        );

        expect((await setUp()).failure).toMatchObject({ status: 502, fatal: true });
    });
});
