import { faker, fakeAsset, fakeAuthor } from "@monorepo/content/testing";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import HomeFeatured from "./Featured.vue";

const global = { mocks: { $t: (key: string) => `t(${key})` } };

const LEAD: ArticleSummary = {
    id: "1",
    slug: "la-teoria-juridica-del-delito",
    title: "La teoría jurídica del delito",
    excerpt: faker.lorem.sentence(),
    publishedAt: "2024-03-12T09:00:00Z",
    image: fakeAsset(),
    authors: [fakeAuthor({ slug: "ana-gil", name: "Ana Gil" })],
    category: { id: "2", slug: "derecho-penal", name: "Derecho penal" },
    tags: [],
    format: "articulo",
    readingMinutes: 24,
};

const LATEST: ArticleSummary[] = [
    {
        ...LEAD,
        id: "3",
        slug: "el-tribunal-del-jurado",
        title: "El tribunal del jurado",
        format: "comentario",
        authors: [fakeAuthor({ name: "Luis Martín" }), fakeAuthor({ name: "Eva Ruiz" })],
    },
    { ...LEAD, id: "4", slug: "un-tfg", title: "Un TFG", format: "tfg-tfm" },
];

const mount = (props: InstanceType<typeof HomeFeatured>["$props"]) =>
    mountSuspended(HomeFeatured, { props, global });

describe("home featured", () => {
    it("titles the lead with a second-level heading linked to its root permalink", async () => {
        const wrapper = await mount({ lead: LEAD, latest: LATEST });

        const title = wrapper.find("article h2 a");

        expect(title.text()).toBe("La teoría jurídica del delito");
        expect(title.attributes("href")).toBe("/la-teoria-juridica-del-delito/");
    });

    // The lead image is the page's largest paint, so it must not wait for the lazy loader
    it("asks for the lead image first", async () => {
        const wrapper = await mount({ lead: LEAD, latest: LATEST });

        expect(wrapper.find("img").attributes()).toMatchObject({
            fetchpriority: "high",
            alt: "",
        });
        expect(wrapper.find("img").attributes("loading")).toBeUndefined();
    });

    it("names the lead's format and links its subject", async () => {
        const wrapper = await mount({ lead: LEAD, latest: LATEST });

        expect(wrapper.find("article").text()).toContain("t(homeFeatured.formats.article)");
        expect(wrapper.find('article a[href="/areas/derecho-penal/"]').text()).toBe(
            "Derecho penal",
        );
    });

    it("lists the latest posts in order, each with its format and every author", async () => {
        const wrapper = await mount({ lead: LEAD, latest: LATEST });

        const items = wrapper.findAll("aside li");

        expect(items.map((item) => item.find("a").attributes("href"))).toEqual([
            "/el-tribunal-del-jurado/",
            "/un-tfg/",
        ]);
        expect(items[0]!.text()).toContain("t(homeFeatured.formats.comment)");
        expect(items[0]!.text()).toContain("Luis Martín, Eva Ruiz");
        expect(items[1]!.text()).toContain("t(homeFeatured.formats.thesis)");
    });

    it("labels the latest list by its own heading", async () => {
        const wrapper = await mount({ lead: LEAD, latest: LATEST });

        const aside = wrapper.find("aside");

        expect(aside.attributes("aria-labelledby")).toBe(aside.find("h2").attributes("id"));
    });
});
