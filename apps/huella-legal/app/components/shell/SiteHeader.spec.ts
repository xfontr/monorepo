import type { NavigationMenuItem } from "@nuxt/ui";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import SiteHeader from "./SiteHeader.vue";

const translate = (key: string) => `t(${key})`;

const SECTIONS: NavigationMenuItem[] = [
    { label: "Publicaciones", to: { name: "publications" } },
    { "label": "Materias", "to": { name: "categories" }, "active": true, "aria-current": "page" },
];

function mountHeader() {
    return mountSuspended(SiteHeader, { route: "/", props: { sections: SECTIONS, issn: "0000-0000" }, global: { mocks: { $t: translate } } });
}

afterEach(() => {
    document.body.innerHTML = "";
});

describe("site header", () => {
    it("passes each section's current state through to its link", async () => {
        const wrapper = await mountHeader();

        expect(wrapper.findAll("nav a").map((link) => [link.attributes("href"), link.attributes("aria-current")])).toEqual([
            ["/publicaciones/", undefined],
            ["/materias/", "page"],
        ]);
    });

    it("names the home link, since the wordmark alone reads as two loose words", async () => {
        const wrapper = await mountHeader();

        expect(wrapper.find("a[href='/']").attributes("aria-label")).toBe("t(app.header.home)");
    });

    it("opens the mobile menu as a named dialog, and closes it from inside", async () => {
        const wrapper = await mountHeader();

        await wrapper.find("[data-slot='toggle']").trigger("click");

        const dialog = document.body.querySelector("[role='dialog']");

        expect(dialog?.textContent).toContain("t(app.header.menu.title)");
        expect(document.getElementById(dialog!.getAttribute("aria-labelledby")!)?.textContent).toBe("t(app.header.menu.title)");

        (dialog!.querySelector("[aria-label='t(app.header.menu.close)']") as HTMLButtonElement).click();
        await flushPromises();

        expect(wrapper.find("[data-slot='toggle']").attributes("aria-expanded")).not.toBe("true");
        expect(document.body.querySelector("[role='dialog']")).toBeNull();
    });
});
