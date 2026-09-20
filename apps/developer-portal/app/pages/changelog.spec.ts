import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { nextTick, ref, watch } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Page from "./changelog.vue";

const state = vi.hoisted(() => ({ asyncData: vi.fn(), query: vi.fn(), changelogs: [] as unknown[], pages: {} as Record<string, unknown>, snapshot: null as { value: unknown } | null }));
mockNuxtImport("useSnapshot", () => () => ({ data: state.snapshot }));
mockNuxtImport("useAsyncData", () => state.asyncData);
mockNuxtImport("queryCollection", () => state.query);

const global = {
    stubs: {
        UDashboardPanel: { template: "<section><slot name='header' /><slot name='body' /></section>" }, UDashboardNavbar: { template: "<header><slot name='right' /></header>" }, UDashboardSidebarCollapse: true,
        UCard: { template: "<article><slot /></article>" }, UAlert: { props: { title: String, description: String }, template: "<div class='alert'>{{ title }} {{ description }}</div>" }, ContentRenderer: { props: { value: Object }, template: "<div>{{ value?.title }}</div>" }, UIcon: true,
    },
};

function setupAsyncData(): void {
    const entries = ref(state.changelogs);
    const query = {
        where: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), all: vi.fn().mockResolvedValue(state.changelogs),
        path: vi.fn().mockImplementation((path: string) => ({ first: vi.fn().mockResolvedValue(state.pages[path]) })),
    };
    state.query.mockReturnValue(query);
    state.asyncData.mockImplementation((key: string | (() => string), handler: () => Promise<unknown>, options: { watch?: unknown[] } = {}) => {
        const data = ref<unknown>(key === "changelogs" ? entries.value : state.pages["/packages/ui/CHANGELOG"] ?? null);
        if (options.watch) {
            watch(options.watch, async () => {
                data.value = await handler();
            });
        }

        return { data, status: ref("success"), execute: vi.fn() };
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    state.changelogs = [];
    state.pages = {};
    state.snapshot = ref({ metrics: { projects: [], conventionalCommitRate: null, commitsSinceLastRelease: 0 }, manifest: {} });
    setupAsyncData();
});

describe("changelog page", () => {
    it("explains the empty workspace when no changelogs exist", async () => {
        const wrapper = await mountSuspended(Page, { global });
        expect(wrapper.text()).toContain("No CHANGELOG.md in the workspace yet.");
    });

    it("joins metrics by project root and warns when shipped commits have no changelog", async () => {
        state.changelogs = [{ path: "/packages/ui/CHANGELOG", title: "UI" }, { path: "/packages/i18n/CHANGELOG", title: "i18n" }];
        state.pages = { "/packages/ui/CHANGELOG": { title: "UI page" }, "/packages/i18n/CHANGELOG": { title: "i18n page" } };
        state.snapshot = ref({
            metrics: {
                projects: [
                    { root: "packages/ui", currentVersion: "3.2.1", unreleasedCommits: 4, hasChangelog: true },
                    { root: "packages/content", currentVersion: null, unreleasedCommits: 2, hasChangelog: false },
                ], conventionalCommitRate: null, commitsSinceLastRelease: 0,
            }, manifest: {},
        });
        setupAsyncData();
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("UI page");
        expect(wrapper.text()).toContain("UI");
        expect(wrapper.text()).toContain("v3.2.1");
        expect(wrapper.text()).toContain("Content — commits since the last tag but no changelog.");
        await wrapper.findAll("button")[1]!.trigger("click");
        await nextTick();
        expect(wrapper.text()).toContain("i18n page");
    });

    it("shows a neutral conventional-subject alert at 100 percent", async () => {
        state.changelogs = [{ path: "/packages/ui/CHANGELOG", title: "UI" }];
        state.snapshot = ref({ metrics: { projects: [], conventionalCommitRate: 100, commitsSinceLastRelease: 0 }, manifest: {} });
        setupAsyncData();
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("Conventional subjects 100% of the last 100 commits parse as a version bump.");
    });

    it("warns when malformed conventional subjects make the rate imperfect", async () => {
        state.changelogs = [{ path: "/packages/ui/CHANGELOG", title: "UI" }];
        state.snapshot = ref({ metrics: { projects: [], conventionalCommitRate: 75, commitsSinceLastRelease: 0 }, manifest: {} });
        setupAsyncData();
        const wrapper = await mountSuspended(Page, { global });

        expect(wrapper.text()).toContain("Conventional subjects 75% of the last 100 commits parse as a version bump.");
    });
});
