import { mountSuspended } from "@nuxt/test-utils/runtime";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { defineComponent, ref } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDeployments } from "./useDeployments.ts";

const fetch = vi.hoisted(() => vi.fn());
const asyncData = vi.hoisted(() => ({ useAsyncData: vi.fn() }));
mockNuxtImport("$fetch", () => fetch);
mockNuxtImport("useAsyncData", () => asyncData.useAsyncData);
const Harness = defineComponent({
    props: { repoUrl: { type: String, default: "" } },
    setup: (props) => {
        useRuntimeConfig().public.repoUrl = props.repoUrl;
        return useDeployments();
    },
    template: "<div />",
});

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("$fetch", fetch);
    useRuntimeConfig().public.repoUrl = "";
    asyncData.useAsyncData.mockImplementation((_key: string, handler: () => Promise<unknown>, options: { default: () => unknown }) => ({
        data: ref(options.default()),
        handler,
        refresh: vi.fn(),
    }));
});

afterEach(() => vi.unstubAllGlobals());

describe("useDeployments", () => {
    async function execute(wrapper: Awaited<ReturnType<typeof mountSuspended>>) {
        const state = wrapper.vm as { data: { value: { deployments: unknown[], error: string | null } }, handler: () => Promise<unknown> };
        state.data.value = await state.handler() as typeof state.data.value;

        return state.data.value;
    }

    it("returns the repository configuration error before attempting GitHub", async () => {
        const wrapper = await mountSuspended(Harness, { props: { repoUrl: "" } });

        expect((await execute(wrapper)).error).toContain("does not name a repository");
        expect(fetch).not.toHaveBeenCalled();
    });

    it("reads statuses only for the newest deployment in each environment", async () => {
        fetch
            .mockResolvedValueOnce([
                { id: 3, environment: "production" },
                { id: 2, environment: "production" },
                { id: 4, environment: "preview" },
            ])
            .mockResolvedValueOnce([{ state: "success", environment_url: "https://prod.example", created_at: "2026-09-20" }])
            .mockResolvedValueOnce([{ state: "failure", environment_url: null, created_at: "2026-09-19" }]);
        const wrapper = await mountSuspended(Harness, { props: { repoUrl: "https://github.com/acme/repo" } });
        const result = await execute(wrapper);

        expect(fetch.mock.calls[0]).toEqual(["https://api.github.com/repos/acme/repo/deployments"]);
        expect(fetch.mock.calls.map(([url]) => url)).toEqual([
            "https://api.github.com/repos/acme/repo/deployments",
            "https://api.github.com/repos/acme/repo/deployments/3/statuses",
            "https://api.github.com/repos/acme/repo/deployments/4/statuses",
        ]);
        expect(result.deployments).toEqual([
            { environment: "preview", state: "failure", url: null, updatedAt: "2026-09-19" },
            { environment: "production", state: "success", url: "https://prod.example", updatedAt: "2026-09-20" },
        ]);
    });

    it.each([
        [new Error("GitHub down"), "GitHub down"],
        ["offline", "GitHub deployments could not be read."],
    ])("exposes a useful deployment error for %s failures", async (cause, message) => {
        fetch.mockRejectedValue(cause);
        const wrapper = await mountSuspended(Harness, { props: { repoUrl: "https://github.com/acme/repo" } });
        const result = await execute(wrapper);

        expect(result.error).toBe(message);
        expect(result.deployments).toEqual([]);
    });

    it("uses the empty client-only default before a deployment read completes", async () => {
        const wrapper = await mountSuspended(Harness, { props: { repoUrl: "https://github.com/acme/repo" } });

        expect(wrapper.vm.data?.deployments).toEqual([]);
        expect(wrapper.vm.data?.error).toBeNull();
        expect(asyncData.useAsyncData.mock.calls[0]?.[2]).toMatchObject({ server: false });
    });
});
