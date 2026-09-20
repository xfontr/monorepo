import { mountSuspended } from "@nuxt/test-utils/runtime";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { defineComponent, ref } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIssues } from "./useIssues.ts";
import type { IssuesRead } from "#shared/issues.ts";

const fetch = vi.hoisted(() => vi.fn());
const asyncData = vi.hoisted(() => ({ useAsyncData: vi.fn() }));
mockNuxtImport("$fetch", () => fetch);
mockNuxtImport("useAsyncData", () => asyncData.useAsyncData);
const Harness = defineComponent({
    props: { repoUrl: { type: String, default: "" } },
    setup(props) {
        useRuntimeConfig().public.repoUrl = props.repoUrl;
        return { state: useIssues() };
    },
    template: "<div />",
});

const githubIssue = (number: number, pullRequest = false) => ({
    number,
    title: `Issue ${number}`,
    body: "A body",
    html_url: `https://github.com/acme/repo/issues/${number}`,
    labels: [{ name: "bug" }],
    assignees: [{ login: "ada" }],
    created_at: "2026-09-19T12:00:00.000Z",
    updated_at: "2026-09-20T11:00:00.000Z",
    ...(pullRequest ? { pull_request: {} } : {}),
});

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("$fetch", fetch);
    useRuntimeConfig().public.repoUrl = "";
    asyncData.useAsyncData.mockImplementation((_key: string, handler: () => Promise<IssuesRead>, options: { default: () => IssuesRead }) => ({
        data: ref(options.default()),
        status: ref("idle"),
        refresh: vi.fn(),
        handler,
        options,
    }));
});

afterEach(() => vi.unstubAllGlobals());

describe("useIssues", () => {
    async function execute(wrapper: Awaited<ReturnType<typeof mountSuspended>>) {
        const state = wrapper.vm.state as { data: { value: IssuesRead }, handler: () => Promise<IssuesRead> };
        state.data.value = await state.handler();

        return state.data.value;
    }

    it("returns a displayable configuration error without making a request", async () => {
        const wrapper = await mountSuspended(Harness, { props: { repoUrl: "" } });
        expect((await execute(wrapper)).error).toContain("no repo to read");
        expect(fetch).not.toHaveBeenCalled();
    });

    it("requests one hundred open issues and removes pull requests from the normalized result", async () => {
        fetch.mockResolvedValue([githubIssue(1), githubIssue(2, true)]);
        const wrapper = await mountSuspended(Harness, { props: { repoUrl: "https://github.com/acme/repo" } });
        const result = await execute(wrapper);

        expect(fetch).toHaveBeenCalledWith(
            "https://api.github.com/repos/acme/repo/issues",
            { query: { state: "open", per_page: 100 } },
        );
        expect(result.issues.map((issue) => issue.number)).toEqual([1]);
        expect(result.fetchedAt).not.toBe("");
    });

    it("prefers GitHub's API message and caps it at three hundred characters", async () => {
        fetch.mockRejectedValue({ data: { message: "x".repeat(400) } });
        const wrapper = await mountSuspended(Harness, { props: { repoUrl: "https://github.com/acme/repo" } });

        expect((await execute(wrapper)).error).toHaveLength(300);
    });

    it.each([
        [new Error("ordinary failure"), "ordinary failure"],
        ["unknown failure", "GitHub could not be read"],
    ])("keeps the intended fallback for a %s failure", async (cause, message) => {
        fetch.mockRejectedValue(cause);
        const wrapper = await mountSuspended(Harness, { props: { repoUrl: "https://github.com/acme/repo" } });

        expect((await execute(wrapper)).error).toBe(message);
    });

    it("exposes refresh through reload and starts with the empty client-only state", async () => {
        fetch.mockResolvedValue([]);
        const wrapper = await mountSuspended(Harness, { props: { repoUrl: "https://github.com/acme/repo" } });
        const result = await execute(wrapper);

        expect(wrapper.vm.state.reload).toBeTypeOf("function");
        expect(result.issues).toEqual([]);
        expect(result.error).toBeNull();
        expect(wrapper.vm.state).toHaveProperty("status");
        expect(asyncData.useAsyncData.mock.calls[0]?.[2]).toMatchObject({ server: false });
    });
});
