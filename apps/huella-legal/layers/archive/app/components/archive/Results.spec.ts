import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import ArchiveResults from "./Results.vue";

const global = {
    mocks: {
        $t: (key: string, params?: Record<string, unknown>) =>
            `t(${key}${params ? `, ${JSON.stringify(params)}` : ""})`,
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

const LISTING: ArticleListing = {
    items: ["1", "2"].map(article),
    page: 1,
    perPage: 20,
    total: 2,
    totalPages: 1,
    formats: [],
    subjects: [],
};

const EMPTY: ArticleListing = { ...LISTING, items: [], total: 0 };

const props = {
    listing: LISTING,
    to: (page: number) => ({ query: { page } }),
    sort: "newest" as const,
};

describe("archive results", () => {
    it("lists every article on the page, labelled by its count heading", async () => {
        const wrapper = await mountSuspended(ArchiveResults, { props, global });

        expect(wrapper.findAll("article")).toHaveLength(2);
        expect(wrapper.attributes("aria-labelledby")).toBe(wrapper.find("h2").attributes("id"));
    });

    it("names the listing with the heading it is given instead of the count", async () => {
        const wrapper = await mountSuspended(ArchiveResults, {
            props: { ...props, heading: "Publicaciones" },
            global,
        });

        expect(wrapper.find("h2").text()).toBe("Publicaciones");
    });

    it("draws format pills only when it is given some", async () => {
        const bare = await mountSuspended(ArchiveResults, { props, global });
        const filtered = await mountSuspended(ArchiveResults, {
            props: {
                ...props,
                formatPills: [
                    { label: "Todo", count: 2, to: "/", active: true },
                    { label: "Comentarios", count: 1, to: "/?format=comentario" },
                ],
            },
            global,
        });

        expect(bare.find("nav[aria-label='t(archiveResults.formats)']").exists()).toBe(false);
        expect(filtered.findAll("nav[aria-label='t(archiveResults.formats)'] a")).toHaveLength(2);
    });

    it("invites an article instead of an empty list when nothing is published in the subject", async () => {
        const wrapper = await mountSuspended(ArchiveResults, {
            props: { ...props, listing: EMPTY, emptySubject: "Derecho civil" },
            global,
        });

        expect(wrapper.find("ol").exists()).toBe(false);
        expect(wrapper.text()).toContain('t(emptyState.title, {"subject":"Derecho civil"})');
    });

    it("shows no empty state without a subject, since its copy names one", async () => {
        const wrapper = await mountSuspended(ArchiveResults, {
            props: { ...props, listing: EMPTY },
            global,
        });

        expect(wrapper.text()).not.toContain("emptyState");
    });
});
