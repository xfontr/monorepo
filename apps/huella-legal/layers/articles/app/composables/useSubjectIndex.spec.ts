import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NuxtError } from "#app";
import { defineComponent, ref, type Ref } from "vue";
import type { SubjectIndex } from "../../shared/types/SubjectIndex";
import { useSubjectIndex } from "./useSubjectIndex";

const INDEX: SubjectIndex = {
    subjects: [{ value: { id: "1", slug: "derecho-penal", name: "Derecho penal" }, count: 3 }],
    formats: [{ value: "articulo", count: 3 }],
    topics: [],
};

const nuxt = vi.hoisted(() => ({
    urls: [] as string[],
    index: undefined as unknown as Ref<SubjectIndex | undefined>,
    error: undefined as unknown as Ref<NuxtError | undefined>,
}));

mockNuxtImport("useFetch", () => (url: string) => {
    nuxt.urls.push(url);

    const result = { data: nuxt.index, error: nuxt.error };

    return Object.assign(Promise.resolve(result), result);
});

const setUp = async () => {
    let controller: Awaited<ReturnType<typeof useSubjectIndex>> | undefined;
    let failure: unknown;

    await mountSuspended(
        defineComponent({
            setup: async () => {
                try {
                    controller = await useSubjectIndex();
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
    nuxt.urls = [];
    nuxt.index = ref(INDEX);
    nuxt.error = ref();
});

describe("useSubjectIndex", () => {
    it("reads the subject index route", async () => {
        const { controller } = await setUp();

        expect(nuxt.urls).toEqual(["/api/subjects"]);
        expect(controller?.index.value).toEqual(INDEX);
    });

    // Thrown during setup, so server rendering answers with the route's own status
    it("throws a fatal page error with the route's status when the index can't be read", async () => {
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
