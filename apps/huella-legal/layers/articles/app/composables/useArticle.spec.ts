import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NuxtError } from "#app";
import { defineComponent, ref, type Ref } from "vue";
import { useArticle } from "./useArticle";

const nuxt = vi.hoisted(() => ({
    urls: [] as string[],
    error: undefined as unknown as Ref<NuxtError | undefined>,
}));

mockNuxtImport("useFetch", () => (url: string) => {
    nuxt.urls.push(url);

    return url.endsWith("/related")
        ? { data: ref([]), error: ref(new Error("related failed")) }
        : Promise.resolve({ data: ref(), error: nuxt.error });
});

async function setUp(route = "/la-culpa/") {
    let failure: unknown;

    await mountSuspended(defineComponent({
        async setup() {
            try {
                await useArticle();
            }
            catch (error) {
                failure = error;
            }

            return () => null;
        },
    }), { route });

    return failure;
}

beforeEach(() => {
    nuxt.urls = [];
    nuxt.error = ref();
});

describe("useArticle", () => {
    it("reads the article named by the route, and its related posts", async () => {
        await setUp("/la-culpa/");

        expect(nuxt.urls).toEqual(["/api/articles/la-culpa/related", "/api/articles/la-culpa"]);
    });

    it("still serves the article when the related list fails", async () => {
        expect(await setUp()).toBeUndefined();
    });

    // Thrown during setup, so server rendering answers with the route's own status
    it("throws a fatal 404 when the post doesn't exist", async () => {
        nuxt.error.value = createError(Object.assign(new Error("Not found"), { statusCode: 404, statusMessage: "Not found", response: { status: 404 } }));

        expect(await setUp()).toMatchObject({ status: 404, fatal: true });
    });
});
