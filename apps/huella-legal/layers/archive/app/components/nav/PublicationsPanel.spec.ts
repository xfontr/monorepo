import { fakeAuthor } from "@monorepo/content/testing";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import NavPublicationsPanel from "./PublicationsPanel.vue";

const translate = (key: string) => `t(${key})`;

const article = (id: string): ArticleSummary => ({
    id,
    slug: `articulo-${id}`,
    title: `Artículo ${id}`,
    authors: [fakeAuthor()],
    tags: [],
    format: "articulo",
    readingMinutes: 5,
});

const HOME: Home = {
    lead: article("lead"),
    latest: ["1", "2", "3"].map(article),
    recent: [],
    theses: [],
    subjects: [],
    formats: [],
};

const fetching = vi.hoisted(() => ({
    home: undefined as Home | undefined,
    status: "success" as string,
}));

mockNuxtImport("useI18n", () => () => ({ t: translate }));
mockNuxtImport("useCachedFetch", () => () => ({
    data: ref(fetching.home),
    status: ref(fetching.status),
}));

const mountPanel = () =>
    mountSuspended(NavPublicationsPanel, { global: { mocks: { $t: translate } } });

const hrefs = (wrapper: Awaited<ReturnType<typeof mountPanel>>) =>
    wrapper.findAll("a").map((link) => link.attributes("href"));

beforeEach(() => {
    fetching.home = HOME;
    fetching.status = "success";
});

describe("publications panel", () => {
    it("previews the lead and then the latest, three in all, after the ways to browse", async () => {
        const wrapper = await mountPanel();

        expect(hrefs(wrapper)).toEqual([
            "/publicaciones/",
            "/publicaciones/?format=articulo",
            "/publicaciones/?format=comentario",
            "/publicaciones/?format=tfg-tfm",
            "/buscar/",
            "/articulo-lead/",
            "/articulo-1/",
            "/articulo-2/",
        ]);
    });

    it("offers the ways to browse while the previews load, so an open panel is never empty", async () => {
        fetching.home = undefined;
        fetching.status = "pending";

        const wrapper = await mountPanel();

        expect(hrefs(wrapper)).toHaveLength(5);
        expect(wrapper.text()).toContain("t(common.loading)");
    });

    it("drops the previews when the home data failed, rather than a heading over nothing", async () => {
        fetching.home = undefined;
        fetching.status = "error";

        const wrapper = await mountPanel();

        expect(wrapper.text()).not.toContain("t(navPublicationsPanel.latest)");
        expect(hrefs(wrapper)).toHaveLength(5);
    });
});
