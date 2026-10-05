import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SiteFooter from "./SiteFooter.vue";

const translate = (key: string, params?: Record<string, unknown>) => params ? `t(${key}, ${JSON.stringify(params)})` : `t(${key})`;

const global = { mocks: { $t: translate } };

const social = vi.hoisted(() => ({ profiles: {} as Record<string, string> }));

mockNuxtImport("useI18n", () => () => ({ t: translate }));
mockNuxtImport("useRuntimeConfig", (original) => () => {
    const config = original();

    return { ...config, public: { ...config.public, social: social.profiles } };
});

beforeEach(() => {
    social.profiles = { instagram: "", linkedin: "", x: "" };
});

describe("site footer", () => {
    it("sends every link to a route the URL decision settled, never to a placeholder", async () => {
        const wrapper = await mountSuspended(SiteFooter, { global });

        const hrefs = wrapper.findAll("nav a").map((link) => link.attributes("href"));

        expect(hrefs).toEqual([
            "/publicaciones/", "/materias/", "/colaboradores/", "/sobre/",
            "/publicar/", "/publicar/#tesis", "/#newsletter", "/contacto/",
            "/aviso-legal/", "/aviso-legal/#privacidad", "/aviso-legal/#cookies",
        ]);
    });

    it("prints the ISSN and the current year beside the copyright", async () => {
        const wrapper = await mountSuspended(SiteFooter, { global });

        expect(wrapper.text()).toContain(`t(app.footer.copyright, {"year":${new Date().getFullYear()},"issn":"2696-7618"})`);
    });

    it("leaves the social list out while no profile is configured", async () => {
        const wrapper = await mountSuspended(SiteFooter, { global });

        expect(wrapper.find("[aria-label='t(app.footer.social.label)']").exists()).toBe(false);
    });

    it("links only the profiles that are set, each named for screen readers", async () => {
        social.profiles = { instagram: "https://instagram.test/huella", linkedin: "", x: "https://x.test/huella" };

        const wrapper = await mountSuspended(SiteFooter, { global });

        const links = wrapper.findAll("[aria-label='t(app.footer.social.label)'] a").map((link) => [link.attributes("href"), link.attributes("aria-label")]);

        expect(links).toEqual([
            ["https://instagram.test/huella", "t(app.footer.social.instagram)"],
            ["https://x.test/huella", "t(app.footer.social.x)"],
        ]);
    });
});
