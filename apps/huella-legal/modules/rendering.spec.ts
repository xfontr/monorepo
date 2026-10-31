import type { Nuxt } from "@nuxt/schema";
import { fakeEntry, wordpressHandlers } from "@monorepo/content/testing";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const kit = vi.hoisted(() => ({ extendRouteRules: vi.fn() }));

vi.mock("nuxt/kit", () => ({
    defineNuxtModule: (definition: unknown) => definition,
    extendRouteRules: kit.extendRouteRules,
}));

const { setup } = (await import("./rendering")).default as unknown as {
    setup: (options: object, nuxt: Nuxt) => void;
};

type RoutesHook = (context: { routes: Set<string> }) => Promise<void>;

const BASE_URL = "http://wordpress.test";
// One past WordPress's ceiling of 50 a page, so the slugs span two pages
const POSTS = Array.from({ length: 51 }, (_, index) => fakeEntry({ slug: `entrada-${index}` }));

const server = setupServer(...wordpressHandlers(BASE_URL, { posts: POSTS }));

const install = (options: Record<string, unknown> = {}) => {
    const hooks = new Map<string, RoutesHook>();
    const nuxt = {
        options: {
            dev: false,
            nitro: { prerender: { crawlLinks: false } },
            runtimeConfig: {
                content: { vendor: { name: "wordpress", baseURL: BASE_URL } },
                public: { pageSlugs: ["aviso-legal"] },
            },
            ...options,
        },
        hook: (name: string, fn: RoutesHook) => hooks.set(name, fn),
    };

    setup({}, nuxt as unknown as Nuxt);

    return { nitro: nuxt.options.nitro, hooks };
};

const collectRoutes = async (hook: RoutesHook | undefined) => {
    const routes = new Set<string>();

    await hook?.({ routes });

    return routes;
};

beforeAll(() => {
    server.listen({ onUnhandledFrame: "error" });
});

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CONTEXT", "deploy-preview");
});

afterEach(() => {
    server.resetHandlers();
    vi.unstubAllEnvs();
});

afterAll(() => {
    server.close();
});

describe("the rendering module", () => {
    // Every build needs them: Nuxt compiles `isr` into the client's payload rules either way
    it("registers the route rules outside a Netlify build too", () => {
        vi.stubEnv("CONTEXT", "");

        install();

        expect(kit.extendRouteRules).toHaveBeenCalledWith("/**", { isr: 86400 });
        expect(kit.extendRouteRules).toHaveBeenCalledWith("/publicaciones/", {
            isr: 86400,
            headers: { "Netlify-Vary": "query=page|sort|format" },
        });
    });

    it("caches an article's comments for minutes, not the day the rest of its routes get", () => {
        install();

        expect(kit.extendRouteRules).toHaveBeenCalledWith("/api/articles/*/comments", {
            isr: 600,
        });
    });

    // CI and e2e serve the built output with the vendors faked, and a file would shadow the fakes
    it("prerenders nothing outside a Netlify build", () => {
        vi.stubEnv("CONTEXT", "");

        const { nitro, hooks } = install();

        expect(hooks.size).toBe(0);
        expect(nitro.prerender).not.toHaveProperty("failOnError");
    });

    it.each([{ _prepare: true }, { dev: true }])(
        "stays out of %o, which writes no output",
        (options) => {
            expect(install(options).hooks.size).toBe(0);
        },
    );

    // Netlify keeps the previous deploy live when a build fails, so a failed page costs nothing
    it("fails the build on any page that fails, keeping the rest of the prerender options", () => {
        expect(install().nitro.prerender).toEqual({ crawlLinks: false, failOnError: true });
    });

    it("lists every post across pages, every listed WordPress page and the query-free routes", async () => {
        const routes = await collectRoutes(install().hooks.get("prerender:routes"));

        expect([...routes].sort()).toEqual(
            [
                "/areas/",
                "/aviso-legal/",
                "/calculo-intereses/",
                "/colaboradores/",
                "/contacto/",
                "/publicar/",
                ...POSTS.map(({ slug }) => `/${slug}/`),
            ].sort(),
        );
    });

    // Otherwise a page the override adds renders from the function, and one it drops fails the build
    it("prerenders the pages NUXT_PUBLIC_PAGE_SLUGS lists in place of the layer's", async () => {
        vi.stubEnv("NUXT_PUBLIC_PAGE_SLUGS", JSON.stringify(["sobre", "contacto"]));

        const routes = await collectRoutes(install().hooks.get("prerender:routes"));

        expect(routes).toContain("/sobre/");
        expect(routes).toContain("/contacto/");
        expect(routes).not.toContain("/aviso-legal/");
    });

    it("fails the build when WordPress can't list the posts", async () => {
        server.use(http.get(`${BASE_URL}/*`, () => HttpResponse.json({}, { status: 503 })));

        await expect(collectRoutes(install().hooks.get("prerender:routes"))).rejects.toMatchObject({
            upstreamStatus: 503,
        });
    });
});
