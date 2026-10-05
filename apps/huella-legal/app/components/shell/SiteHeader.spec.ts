import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import type { VueWrapper } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import SiteHeader from "./SiteHeader.vue";

const translate = (key: string) => `t(${key})`;

const global = { mocks: { $t: translate } };

mockNuxtImport("useI18n", () => () => ({ t: translate }));

function currentOf(wrapper: VueWrapper) {
    return wrapper.findAll("nav a").map((link) => [link.attributes("href"), link.attributes("aria-current")]);
}

afterEach(() => {
    document.body.innerHTML = "";
});

describe("site header", () => {
    it("marks the section being read as the current page", async () => {
        const wrapper = await mountSuspended(SiteHeader, { route: "/materias/", global });

        expect(currentOf(wrapper)).toContainEqual(["/materias/", "page"]);
        expect(wrapper.findAll("[aria-current]")).toHaveLength(1);
    });

    it("keeps a section current on its detail pages, without claiming to be that page", async () => {
        const wrapper = await mountSuspended(SiteHeader, { route: "/materias/derecho-civil/", global });

        expect(currentOf(wrapper)).toContainEqual(["/materias/", "true"]);
    });

    it("marks nothing current on a page outside the four sections", async () => {
        const wrapper = await mountSuspended(SiteHeader, { route: "/", global });

        expect(wrapper.findAll("[aria-current]")).toHaveLength(0);
    });

    it("names the home link, since the wordmark alone reads as two loose words", async () => {
        const wrapper = await mountSuspended(SiteHeader, { route: "/", global });

        expect(wrapper.find("a[href='/']").attributes("aria-label")).toBe("t(app.header.home)");
    });

    it("opens the mobile menu as a named dialog, and closes it from inside", async () => {
        const wrapper = await mountSuspended(SiteHeader, { route: "/", global });

        await wrapper.find("[data-slot='toggle']").trigger("click");

        const dialog = document.body.querySelector("[role='dialog']");

        expect(dialog?.textContent).toContain("t(app.header.menu.title)");
        expect(document.getElementById(dialog!.getAttribute("aria-labelledby")!)?.textContent).toBe("t(app.header.menu.title)");

        (dialog!.querySelector("[aria-label='t(app.header.menu.close)']") as HTMLButtonElement).click();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(wrapper.find("[data-slot='toggle']").attributes("aria-expanded")).not.toBe("true");
        expect(document.body.querySelector("[role='dialog']")).toBeNull();
    });
});
