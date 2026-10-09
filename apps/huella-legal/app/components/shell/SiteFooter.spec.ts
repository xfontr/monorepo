import type { FooterColumn } from "@nuxt/ui";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import SiteFooter from "./SiteFooter.vue";

const translate = (key: string, params?: Record<string, unknown>) =>
    params ? `t(${key}, ${JSON.stringify(params)})` : `t(${key})`;

const COLUMNS: FooterColumn[] = [
    {
        label: "Legal",
        children: [
            { label: "Aviso legal", to: { name: "article", params: { slug: "aviso-legal" } } },
        ],
    },
];

const SOCIAL = [
    {
        key: "x",
        icon: "i-lucide-twitter",
        to: "https://x.test/huella",
        label: "X (se abre en una pestaña nueva)",
    },
];

function mountFooter(social = SOCIAL) {
    return mountSuspended(SiteFooter, {
        props: { columns: COLUMNS, social, issn: "2696-7618" },
        global: { mocks: { $t: translate } },
    });
}

describe("site footer", () => {
    it("renders the columns inside the named footer nav", async () => {
        const wrapper = await mountFooter();

        const nav = wrapper.find("nav[aria-label='t(app.footer.label)']");

        expect(nav.findAll("a").map((link) => [link.attributes("href"), link.text()])).toEqual([
            ["/aviso-legal/", "Aviso legal"],
        ]);
    });

    it("prints the ISSN and the current year beside the copyright", async () => {
        const wrapper = await mountFooter();

        expect(wrapper.text()).toContain(
            `t(app.footer.copyright, {"year":${new Date().getFullYear()},"issn":"2696-7618"})`,
        );
    });

    it("leaves the social list out while no profile is configured", async () => {
        const wrapper = await mountFooter([]);

        expect(wrapper.find("[aria-label='t(app.footer.social.label)']").exists()).toBe(false);
    });

    it("names each profile link with its new-tab warning, since the icon is all a sighted reader gets", async () => {
        const wrapper = await mountFooter();

        const links = wrapper
            .findAll("[aria-label='t(app.footer.social.label)'] a")
            .map((link) => [link.attributes("href"), link.attributes("aria-label")]);

        expect(links).toEqual([["https://x.test/huella", "X (se abre en una pestaña nueva)"]]);
    });
});
