import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { useRouter, type RouteLocationRaw } from "vue-router";
import { useSiteNav } from "./useSiteNav";

const translate = (key: string, params?: Record<string, unknown>) =>
    params ? `t(${key}, ${JSON.stringify(params)})` : `t(${key})`;

const social = vi.hoisted(() => ({ profiles: {} as Record<string, string> }));

mockNuxtImport("useI18n", () => () => ({ t: translate }));
mockNuxtImport("useRuntimeConfig", (original) => () => {
    const config = original();

    return { ...config, public: { ...config.public, social: social.profiles } };
});

const navAt = async (route: string) => {
    let nav!: ReturnType<typeof useSiteNav>;
    let href!: (to: RouteLocationRaw) => string;

    await mountSuspended(
        defineComponent({
            setup: () => {
                nav = useSiteNav();
                const router = useRouter();
                href = (to) => router.resolve(to).href;
                return () => null;
            },
        }),
        { route },
    );

    return Object.assign(nav, { href });
};

const currentOf = (nav: ReturnType<typeof useSiteNav>) =>
    nav.sections.value.map((item) => item["aria-current"]);

beforeEach(() => {
    social.profiles = { instagram: "", linkedin: "", x: "" };
});

describe("useSiteNav", () => {
    it("marks the section being read as the current page, and nothing else", async () => {
        const nav = await navAt("/materias/");

        expect(currentOf(nav)).toEqual([undefined, "page", undefined, undefined]);
    });

    it("keeps a section current on its detail pages, without claiming to be that page", async () => {
        const nav = await navAt("/materias/derecho-civil/");

        expect(currentOf(nav)).toEqual([undefined, "true", undefined, undefined]);
    });

    it("still finds the section when the URL arrives without its trailing slash", async () => {
        const nav = await navAt("/materias");

        expect(currentOf(nav)).toEqual([undefined, "page", undefined, undefined]);
    });

    it("marks nothing current on a page outside the four sections", async () => {
        const nav = await navAt("/");

        expect(currentOf(nav)).toEqual([undefined, undefined, undefined, undefined]);
    });

    it("sends every footer link to a route the URL decision settled, never to a placeholder", async () => {
        const nav = await navAt("/");

        expect(
            nav.columns.value.flatMap(({ children }) => children?.map(({ to }) => nav.href(to!))),
        ).toEqual([
            "/publicaciones/",
            "/materias/",
            "/colaboradores/",
            "/sobre/",
            "/publicar/",
            "/publicar/#tesis",
            "/#newsletter",
            "/contacto/",
            "/aviso-legal/",
            "/aviso-legal/#privacidad",
            "/aviso-legal/#cookies",
        ]);
    });

    it("takes the ISSN from app config, so the header and footer print the same one", async () => {
        const nav = await navAt("/");

        expect(nav.issn).toBe("2696-7618");
    });

    it("leaves out every profile that is not configured", async () => {
        const nav = await navAt("/");

        expect(nav.social.value).toEqual([]);
    });

    it("links only the profiles that are set, each warning that it opens a new tab", async () => {
        social.profiles = {
            instagram: "https://instagram.test/huella",
            linkedin: "",
            x: "https://x.test/huella",
        };

        const nav = await navAt("/");

        expect(nav.social.value.map(({ to, label }) => [to, label])).toEqual([
            [
                "https://instagram.test/huella",
                't(app.footer.social.external, {"network":"t(app.footer.social.instagram)"})',
            ],
            [
                "https://x.test/huella",
                't(app.footer.social.external, {"network":"t(app.footer.social.x)"})',
            ],
        ]);
    });
});
