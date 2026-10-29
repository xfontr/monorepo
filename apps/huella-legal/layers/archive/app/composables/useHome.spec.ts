import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NuxtError } from "#app";
import { defineComponent, ref, type Ref } from "vue";
import { useHome } from "./useHome";

const HOME: Home = {
    latest: [],
    recent: [],
    theses: [],
    subjects: [{ value: { id: "1", slug: "derecho-penal", name: "Derecho penal" }, count: 3 }],
    formats: [{ value: "articulo", count: 3 }],
};

const nuxt = vi.hoisted(() => ({
    urls: [] as string[],
    home: undefined as unknown as Ref<Home | undefined>,
    error: undefined as unknown as Ref<NuxtError | undefined>,
}));

mockNuxtImport("useCachedFetch", () => (url: string) => {
    nuxt.urls.push(url);

    const result = { data: nuxt.home, error: nuxt.error };

    return Object.assign(Promise.resolve(result), result);
});

const setUp = async () => {
    let controller: Awaited<ReturnType<typeof useHome>> | undefined;
    let failure: unknown;

    await mountSuspended(
        defineComponent({
            setup: async () => {
                try {
                    controller = await useHome();
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
    nuxt.home = ref(HOME);
    nuxt.error = ref();
});

describe("useHome", () => {
    it("reads the home route", async () => {
        const { controller } = await setUp();

        expect(nuxt.urls).toEqual(["/api/home"]);
        expect(controller?.home.value).toEqual(HOME);
    });

    // Thrown during setup, so server rendering answers with the route's own status
    it("throws a fatal page error with the route's status when the home can't be read", async () => {
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
