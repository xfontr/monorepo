import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref, type Ref } from "vue";
import ArticleView from "./View.vue";

const ARTICLE: Article = {
    id: "1",
    slug: "la-culpa",
    title: "La culpa",
    authors: [],
    tags: [],
    category: { id: "2", slug: "derecho-penal", name: "Derecho penal" },
    format: "comentario",
    readingMinutes: 12,
    body: { lead: "<p>Uno</p>", html: "", toc: [], notes: [], bibliography: [] },
    permalink: "https://revista.test/la-culpa/",
    citations: [],
};

const RELATED: ArticleSummary = {
    id: "5",
    slug: "el-dolo",
    title: "El dolo",
    authors: [],
    tags: [],
    format: "articulo",
    readingMinutes: 6,
};

const nuxt = vi.hoisted(() => ({
    article: undefined as unknown as Ref<Article | undefined>,
    related: undefined as unknown as Ref<ArticleSummary[]>,
    comments: undefined as unknown as Ref<ArticleComments | undefined>,
}));

mockNuxtImport("useArticle", () => async () => ({
    article: nuxt.article,
    related: nuxt.related,
    authorCounts: ref({}),
    comments: nuxt.comments,
}));

beforeEach(() => {
    nuxt.article = ref(ARTICLE);
    nuxt.related = ref([RELATED]);
    nuxt.comments = ref();
});

describe("article view", () => {
    it("renders the article useArticle read, with its related band", async () => {
        const wrapper = await mountSuspended(ArticleView);

        expect(wrapper.find("h1").text()).toBe("La culpa");
        expect(wrapper.find('a[href="/el-dolo/"]').exists()).toBe(true);
    });

    // The band is named and linked after the category, so it has nothing to stand on without one
    it("leaves out the related band for an uncategorised article", async () => {
        nuxt.article = ref({ ...ARTICLE, category: undefined });

        const wrapper = await mountSuspended(ArticleView);

        expect(wrapper.find('a[href="/el-dolo/"]').exists()).toBe(false);
    });

    it("links the header's comment count to the thread once the comments arrive", async () => {
        nuxt.comments = ref({ open: true, count: 3, threads: [] });

        const wrapper = await mountSuspended(ArticleView);

        expect(wrapper.find('a[href$="#comentarios"]').exists()).toBe(true);
    });

    it("renders nothing rather than an empty article while there is no post", async () => {
        nuxt.article = ref();

        const wrapper = await mountSuspended(ArticleView);

        expect(wrapper.find("article").exists()).toBe(false);
    });
});
