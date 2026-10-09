import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import Pagination from "./Pagination.vue";

const global = {
    mocks: {
        $t: (key: string, params?: Record<string, unknown>) =>
            `t(${key}${params ? `, ${JSON.stringify(params)}` : ""})`,
    },
};

const to = (page: number) => `/listado/${page}`;

const mountAt = async (page: number, total = 48) =>
    mountSuspended(Pagination, { props: { page, total, perPage: 7, to }, global });

describe("pagination", () => {
    it("renders nothing for a single page, so a short listing has no dead controls", async () => {
        const wrapper = await mountAt(1, 7);

        expect(wrapper.find("nav").exists()).toBe(false);
    });

    it("takes every page's address from `to`, so the listing's controller alone owns the URL", async () => {
        const wrapper = await mountAt(10, 140);

        const pages = wrapper
            .findAll("a[aria-label^='t(pagination.page']")
            .map((link) => [link.text(), link.attributes("href")]);

        expect(pages).toEqual([
            ["1", "/listado/1"],
            ["9", "/listado/9"],
            ["10", "/listado/10"],
            ["11", "/listado/11"],
            ["20", "/listado/20"],
        ]);
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

        const previous = wrapper.find("[aria-label='t(pagination.previous.label)']");

        expect(previous.element.tagName).toBe("BUTTON");
        expect(previous.attributes("disabled")).toBeDefined();
        expect(wrapper.find("[aria-label='t(pagination.next.label)']").attributes("href")).toBe(
            "/listado/2",
        );
    });

    it("has no live next link on the last page", async () => {
        const wrapper = await mountAt(7);

        const next = wrapper.find("[aria-label='t(pagination.next.label)']");

        expect(next.element.tagName).toBe("BUTTON");
        expect(next.attributes("disabled")).toBeDefined();
        expect(wrapper.find("[aria-label='t(pagination.previous.label)']").attributes("href")).toBe(
            "/listado/6",
        );
    });

    it("counts pages from the total, rounding a partial last page up", async () => {
        const wrapper = await mountAt(2, 15);

        expect(wrapper.find("p").text()).toBe('t(pagination.position, {"page":2,"total":3})');
    });

    it("names the landmark, since a listing page has more than one nav", async () => {
        const wrapper = await mountAt(1);

        expect(wrapper.find("nav").attributes("aria-label")).toBe("t(pagination.label)");
    });
});
