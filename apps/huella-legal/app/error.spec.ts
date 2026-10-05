import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ErrorPage from "./error.vue";

const head = vi.hoisted(() => ({ useHead: vi.fn(), reloadNuxtApp: vi.fn() }));

const translate = (key: string, params?: Record<string, unknown>) => params ? `t(${key}, ${JSON.stringify(params)})` : `t(${key})`;

mockNuxtImport("useHead", () => head.useHead);
mockNuxtImport("useI18n", () => () => ({ t: translate }));
mockNuxtImport("reloadNuxtApp", () => head.reloadNuxtApp);

const global = {
    mocks: { $t: translate },
    stubs: { NuxtLayout: { template: "<div data-shell='layout'><slot /></div>" } },
};

const NOT_FOUND = { status: 404, message: "Page not found", stack: "Error: Page not found\n    at render" };
const SERVER = { status: 503, message: "Upstream unavailable", stack: "Error: Upstream unavailable\n    at fetch" };

function mountError(error: Record<string, unknown>) {
    return mount(ErrorPage, { props: { error: error as never }, global });
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("error page", () => {
    it("renders inside the site layout, so a reader who hits it can still navigate away", () => {
        const wrapper = mountError(NOT_FOUND);

        expect(wrapper.find("[data-shell='layout'] h1").exists()).toBe(true);
    });

    it("shows the not-found design, with a search that lands on the search page, for a 404", () => {
        const wrapper = mountError(NOT_FOUND);

        const form = wrapper.find("form[role='search']");

        expect(wrapper.find("[data-error='not-found']").exists()).toBe(true);
        expect(wrapper.find("h1").text()).toBe("t(error.notFound.title)");
        expect([form.attributes("action"), form.attributes("method"), form.find("input").attributes("name")]).toEqual(["/buscar/", "get", "q"]);
    });

    it.each([500, 502, 503])("shows the server design for a %i, keeping the real status in the kicker", (status) => {
        const wrapper = mountError({ ...SERVER, status });

        expect(wrapper.find("[data-error='server']").exists()).toBe(true);
        expect(wrapper.text()).toContain(`t(error.kicker, {"status":${status}})`);
    });

    it("retries by reloading the page the reader was on", async () => {
        const wrapper = mountError(SERVER);

        await wrapper.find("[data-error='server'] button").trigger("click");

        expect(head.reloadNuxtApp).toHaveBeenCalledOnce();
    });

    it("keeps error pages out of search results", () => {
        mountError(NOT_FOUND);

        const [{ title, meta }] = head.useHead.mock.calls[0] as [{ title: string, meta: object[] }];

        expect(title).toBe("t(error.head, {\"status\":404})");
        expect(meta).toContainEqual({ name: "robots", content: "noindex" });
    });

    it("outranks the layout's site title, which would otherwise win by rendering later", () => {
        mountError(NOT_FOUND);

        expect(head.useHead.mock.calls[0]?.[1]).toEqual({ tagPriority: "high" });
    });

    it.each([NOT_FOUND, SERVER])("never shows a reader the upstream message or the stack ($status)", (error) => {
        const wrapper = mountError({ ...error, data: { message: "WordPress answered 404" } });

        expect(wrapper.find(".error__debug").exists()).toBe(false);
        expect(wrapper.text()).not.toContain("WordPress answered 404");
        expect(wrapper.text()).not.toContain(error.message);
        expect(wrapper.text()).not.toContain("at ");
    });
});
