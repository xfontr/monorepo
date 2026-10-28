import type { AsyncData, NuxtError } from "#app";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick, ref } from "vue";
import { useFailOnError } from "./useFailOnError";

const NOT_FOUND = { cause: { response: { status: 404 } } } as unknown as NuxtError;

const errors = vi.hoisted(() => ({ show: vi.fn() }));

mockNuxtImport("showError", () => errors.show);

const requestFailing = (initial?: NuxtError) => {
    const error = ref(initial);
    const result = { error };

    return {
        error,
        request: Object.assign(Promise.resolve(result), result) as unknown as AsyncData<
            unknown,
            NuxtError | undefined
        >,
    };
};

const mountWith = async (
    request: AsyncData<unknown, NuxtError | undefined>,
    options?: Parameters<typeof useFailOnError>[1],
) => {
    let failure: unknown;

    const wrapper = await mountSuspended(
        defineComponent({
            setup: async () => {
                await useFailOnError(request, options).catch((error: unknown) => {
                    failure = error;
                });

                return () => null;
            },
        }),
    );

    if (failure) throw failure;

    return wrapper;
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe("useFailOnError", () => {
    it("fails the first render with the route's status when the first response failed", async () => {
        const { request } = requestFailing(NOT_FOUND);

        await expect(mountWith(request)).rejects.toMatchObject({ status: 404 });
    });

    it("shows the error page when a later refetch fails, since setup never runs again", async () => {
        const { request, error } = requestFailing();
        await mountWith(request, { refetches: true });

        error.value = NOT_FOUND;

        await vi.waitFor(() =>
            expect(errors.show).toHaveBeenCalledWith(expect.objectContaining({ status: 404 })),
        );
    });

    it("doesn't watch for later errors unless the request refetches", async () => {
        const { request, error } = requestFailing();
        await mountWith(request);

        error.value = NOT_FOUND;
        await nextTick();

        expect(errors.show).not.toHaveBeenCalled();
    });

    it("stops watching for errors once the page is gone", async () => {
        const { request, error } = requestFailing();
        const wrapper = await mountWith(request, { refetches: true });

        wrapper.unmount();
        error.value = NOT_FOUND;
        await nextTick();

        expect(errors.show).not.toHaveBeenCalled();
    });
});
