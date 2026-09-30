import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ErrorPage from "./error.vue";

const head = vi.hoisted(() => ({ useHead: vi.fn() }));

mockNuxtImport("useHead", () => head.useHead);

const NOT_FOUND = { status: 404, message: "Page not found", stack: "Error: Page not found\n    at render" };

function mountError(error: Record<string, unknown>) {
    return mount(ErrorPage, { props: { error: error as never } });
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("error page", () => {
    it("shows the status and the message a reader can act on", () => {
        const wrapper = mountError(NOT_FOUND);

        expect(wrapper.find(".error__status").text()).toBe("404");
        expect(wrapper.find(".error__message").text()).toBe("Page not found");
    });

    it("keeps error pages out of search results", () => {
        mountError(NOT_FOUND);

        const [{ title, meta }] = head.useHead.mock.calls[0] as [{ title: string, meta: object[] }];

        expect(title).toBe("Error 404");
        expect(meta).toContainEqual({ name: "robots", content: "noindex" });
    });

    it("never shows a reader the upstream message or the stack", () => {
        const wrapper = mountError({ ...NOT_FOUND, data: { message: "WordPress answered 404" } });

        expect(wrapper.find(".error__debug").exists()).toBe(false);
        expect(wrapper.text()).not.toContain("WordPress answered 404");
        expect(wrapper.text()).not.toContain("at render");
    });
});
