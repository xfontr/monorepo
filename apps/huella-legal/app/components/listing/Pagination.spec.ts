import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import Pagination from "./Pagination.vue";

const global = { mocks: { $t: (key: string, params?: Record<string, unknown>) => `t(${key}${params ? `, ${JSON.stringify(params)}` : ""})` } };

async function mountAt(page: number, total = 48, route = "/") {
    return mountSuspended(Pagination, { props: { page, total, perPage: 7 }, global, route });
}

describe("pagination", () => {
    it("renders nothing for a single page, so a short listing has no dead controls", async () => {
        const wrapper = await mountAt(1, 7);

        expect(wrapper.find("nav").exists()).toBe(false);
    });

    it("links every page by its query, with page one on the bare URL so the listing has one address", async () => {
        const wrapper = await mountAt(10, 140);

        const pages = wrapper.findAll("a[aria-label^='t(pagination.page']").map((link) => [link.text(), link.attributes("href")]);

        expect(pages).toEqual([["1", "/"], ["9", "/?page=9"], ["10", "/?page=10"], ["11", "/?page=11"], ["20", "/?page=20"]]);
    });

    it("keeps the rest of the query, so paging never drops the sort or the filter", async () => {
        const wrapper = await mountAt(1, 48, "/?orden=antiguas");

        expect(wrapper.find("[aria-label='t(pagination.next.name)']").attributes("href")).toBe("/?orden=antiguas&page=2");
    });

    it("marks only the current page with aria-current", async () => {
        const wrapper = await mountAt(4);

        const current = wrapper.findAll("[aria-current]");

        expect(current).toHaveLength(1);
        expect(current[0]!.attributes("aria-current")).toBe("page");
        expect(current[0]!.text()).toBe("4");
    });

    it("has no live previous link on the first page", async () => {
        const wrapper = await mountAt(1);

        const previous = wrapper.find("[aria-label='t(pagination.previous.name)']");

        expect(previous.element.tagName).toBe("BUTTON");
        expect(previous.attributes("disabled")).toBeDefined();
        expect(wrapper.find("[aria-label='t(pagination.next.name)']").attributes("href")).toBe("/?page=2");
    });

    it("has no live next link on the last page", async () => {
        const wrapper = await mountAt(7);

        const next = wrapper.find("[aria-label='t(pagination.next.name)']");

        expect(next.element.tagName).toBe("BUTTON");
        expect(next.attributes("disabled")).toBeDefined();
        expect(wrapper.find("[aria-label='t(pagination.previous.name)']").attributes("href")).toBe("/?page=6");
    });

    it("counts pages from the total, rounding a partial last page up", async () => {
        const wrapper = await mountAt(2, 15);

        expect(wrapper.find("p").text()).toBe("t(pagination.position, {\"page\":2,\"total\":3})");
    });

    it("names the landmark, since a listing page has more than one nav", async () => {
        const wrapper = await mountAt(1);

        expect(wrapper.find("nav").attributes("aria-label")).toBe("t(pagination.label)");
    });
});
