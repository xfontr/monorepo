import type { NavigationMenuItem } from "@nuxt/ui";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SiteHeader from "./SiteHeader.vue";

const translate = (key: string) => `t(${key})`;

const SECTIONS: NavigationMenuItem[] = [
    { label: "Publicaciones", to: { name: "publications" } },
    { label: "Áreas", to: { name: "categories" }, active: true, "aria-current": "page" },
];

const MOVED: NavigationMenuItem[] = [
    { label: "Publicaciones", to: { name: "publications" }, active: true, "aria-current": "page" },
    { label: "Áreas", to: { name: "categories" } },
];

const media = vi.hoisted(() => ({ wide: false }));

const currentOf = (wrapper: Awaited<ReturnType<typeof mountHeader>>) =>
    wrapper.findAll("nav a").map((link) => link.attributes("aria-current"));

const mountHeader = () =>
    mountSuspended(SiteHeader, {
        route: "/",
        props: { sections: SECTIONS, issn: "0000-0000" },
        global: { mocks: { $t: translate } },
    });

beforeEach(() => {
    media.wide = false;
    vi.stubGlobal("matchMedia", (query: string) => ({
        matches: media.wide,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
    }));
});

afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
});

describe("site header", () => {
    it("passes each section's current state through to its link", async () => {
        const wrapper = await mountHeader();

        expect(
            wrapper
                .findAll("nav a")
                .map((link) => [link.attributes("href"), link.attributes("aria-current")]),
        ).toEqual([
            ["/publicaciones/", undefined],
            ["/areas/", "page"],
        ]);
    });

    it("holds the inline menu below lg, so a navigation on a phone never loads the desktop menu", async () => {
        const wrapper = await mountHeader();

        await wrapper.setProps({ sections: MOVED });

        expect(currentOf(wrapper)).toEqual([undefined, "page"]);
    });

    it("moves the inline menu's marker with the route on a wide screen", async () => {
        media.wide = true;
        const wrapper = await mountHeader();

        await wrapper.setProps({ sections: MOVED });

        expect(currentOf(wrapper)).toEqual(["page", undefined]);
    });

    it("names the home link, since the wordmark alone reads as two loose words", async () => {
        const wrapper = await mountHeader();

        expect(wrapper.find("a[href='/']").attributes("aria-label")).toBe("t(app.header.home)");
    });

    it("opens the mobile menu as a named dialog, and closes it from inside", async () => {
        const wrapper = await mountHeader();

        await wrapper.find("[data-slot='toggle']").trigger("click");

        // UHeader imports its slideover lazily, so the dialog lands after a module load, not a tick.
        const dialog = await vi.waitFor(() => {
            const found = document.body.querySelector("[role='dialog']");
            expect(found).not.toBeNull();
            return found;
        });

        expect(dialog?.textContent).toContain("t(app.header.menu.title)");
        expect(document.getElementById(dialog!.getAttribute("aria-labelledby")!)?.textContent).toBe(
            "t(app.header.menu.title)",
        );

        (
            dialog!.querySelector("[aria-label='t(app.header.menu.close)']") as HTMLButtonElement
        ).click();
        await flushPromises();

        expect(wrapper.find("[data-slot='toggle']").attributes("aria-expanded")).not.toBe("true");
        expect(document.body.querySelector("[role='dialog']")).toBeNull();
    });
});
