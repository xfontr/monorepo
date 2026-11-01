import { fakeAuthor } from "@monorepo/content/testing";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, ref, type Ref } from "vue";
import { useScholarlyMeta } from "./useScholarlyMeta";

const ARTICLE: Article = {
    id: "1",
    slug: "la-culpa",
    title: "La culpa",
    excerpt: "El deber de cuidado.",
    publishedAt: "2025-05-02T08:00:00Z",
    authors: [fakeAuthor()],
    tags: [],
    format: "comentario",
    readingMinutes: 12,
    body: { lead: "", html: "", toc: [], notes: [], bibliography: [] },
    permalink: "https://revista.test/la-culpa/",
    citations: [],
};

interface Head {
    meta?: () => Record<string, unknown>[];
}

const nuxt = vi.hoisted(() => ({
    head: {} as Head,
    schema: undefined as unknown as Ref<Record<string, unknown>[]>,
}));

mockNuxtImport("useHead", () => (input: Head) => {
    nuxt.head = { ...nuxt.head, ...input };
});

mockNuxtImport("useSchemaOrg", () => (input: Ref<Record<string, unknown>[]>) => {
    nuxt.schema = input;
});

const setUp = (article: Article | undefined) =>
    mountSuspended(
        defineComponent({
            setup: () => {
                useScholarlyMeta(ref(article));

                return () => null;
            },
        }),
    );

const meta = () => nuxt.head.meta?.() ?? [];

beforeEach(() => {
    nuxt.head = {};
});

describe("useScholarlyMeta", () => {
    it("keys each citation tag apart, so every co-author survives deduplication", async () => {
        await setUp({ ...ARTICLE, authors: [fakeAuthor(), fakeAuthor()] });

        const authors = meta().filter(({ name }) => name === "citation_author");
        const keys = meta().map(({ key }) => key);

        expect(authors).toHaveLength(2);
        expect(new Set(keys).size).toBe(keys.length);
    });

    it("describes the article as a ScholarlyArticle for search engines", async () => {
        await setUp(ARTICLE);

        expect(nuxt.schema.value).toContainEqual(
            expect.objectContaining({
                "@type": "ScholarlyArticle",
                isPartOf: { "@id": "https://revista.test/#periodical" },
            }),
        );
        expect(nuxt.schema.value).toContainEqual(
            expect.objectContaining({ "@type": "Periodical", issn: "2696-7618" }),
        );
    });

    it("emits no scholarly metadata without an article", async () => {
        await setUp(undefined);

        expect([meta(), nuxt.schema.value]).toEqual([[], []]);
    });
});
