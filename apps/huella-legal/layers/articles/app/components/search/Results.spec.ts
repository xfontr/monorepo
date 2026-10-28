import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import type { ArticleSearch } from "../../../shared/types/ArticleSearch";
import type { ArticleSummary } from "../../../shared/types/ArticleSummary";
import SearchResults from "./Results.vue";

const global = {
    mocks: {
        $t: (key: string, params?: unknown) =>
            `t(${key}${params === undefined ? "" : `, ${JSON.stringify(params)}`})`,
    },
};

const article = (id: string): ArticleSummary => ({
    id,
    slug: `articulo-${id}`,
    title: `Artículo ${id}`,
    authors: [],
    tags: [],
    format: "articulo",
    readingMinutes: 3,
});

const SEARCH: ArticleSearch = {
    items: ["1", "2"].map(article),
    page: 1,
    perPage: 20,
    total: 2,
    totalPages: 1,
    query: "culpa",
    subjects: [],
};

const NOTHING: ArticleSearch = {
    ...SEARCH,
    items: [],
    total: 0,
    subjects: [{ id: "9", slug: "derecho-penal", name: "Derecho penal" }],
};

const props = { search: SEARCH, to: (page: number) => ({ query: { page } }) };

describe("search results", () => {
    it("lists every match, labelled by the count heading", async () => {
        const wrapper = await mountSuspended(SearchResults, { props, global });

        expect(wrapper.findAll("article")).toHaveLength(2);
        expect(wrapper.attributes("aria-labelledby")).toBe(wrapper.find("h2").attributes("id"));
    });

    it("shows the skeleton instead of the last query's matches while the next one loads", async () => {
        const wrapper = await mountSuspended(SearchResults, {
            props: { ...props, pending: true },
            global,
        });

        expect(wrapper.attributes("aria-busy")).toBe("true");
        expect(wrapper.text()).toContain("t(skeletonList.loading)");
        expect(wrapper.findAll("article")).toHaveLength(0);
    });

    it("shows the skeleton when there is no answer yet, never the no-results state", async () => {
        const wrapper = await mountSuspended(SearchResults, {
            props: { ...props, search: undefined },
            global,
        });

        expect(wrapper.text()).toContain("t(skeletonList.loading)");
        expect(wrapper.text()).not.toContain("noResults.title");
    });

    it("offers the suggested subjects to browse when nothing matched", async () => {
        const wrapper = await mountSuspended(SearchResults, {
            props: { ...props, search: NOTHING },
            global,
        });

        expect(wrapper.text()).toContain('t(noResults.title, {"query":"culpa"})');
        expect(wrapper.find("a[href='/areas/derecho-penal/']").exists()).toBe(true);
    });

    it("announces the answer in a status region that outlives the skeleton, so it is read out", async () => {
        const wrapper = await mountSuspended(SearchResults, {
            props: { ...props, pending: true },
            global,
        });

        const status = wrapper.find("[role='status']");

        expect(status.text()).toBe("");

        await wrapper.setProps({ pending: false });

        expect(wrapper.find("[role='status']").element).toBe(status.element);
        expect(status.text()).toContain("searchResults.count");

        await wrapper.setProps({ search: NOTHING });

        expect(status.text()).toContain("noResults.title");
    });
});
