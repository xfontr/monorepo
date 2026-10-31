import {
    createProvider,
    MAX_PER_PAGE,
    OfetchHttpClient,
    type VendorConfig,
} from "@monorepo/content";
import { defineNuxtModule, extendRouteRules } from "nuxt/kit";
import { ofetch } from "ofetch";
import { readAllPages } from "../layers/articles/server/utils/readAllPages";

type RouteRule = Parameters<typeof extendRouteRules>[1];

const ONE_DAY = 60 * 60 * 24;

const varyOn = (...keys: string[]): RouteRule => ({
    isr: ONE_DAY,
    headers: { "Netlify-Vary": `query=${keys.join("|")}` },
});

const LISTING = varyOn("page", "sort", "format");

const ROUTE_RULES: Record<string, RouteRule> = {
    "/**": { isr: ONE_DAY },
    "/publicaciones/": LISTING,
    "/areas/*": LISTING,
    "/etiquetas/*": LISTING,
    "/colaboradores/*": LISTING,
    "/buscar/": varyOn("query", "page"),
    "/publicaciones/_payload.json": LISTING,
    "/areas/*/_payload.json": LISTING,
    "/etiquetas/*/_payload.json": LISTING,
    "/colaboradores/*/_payload.json": LISTING,
    "/buscar/_payload.json": varyOn("query", "page"),
    "/robots.txt": { isr: false },
    "/api/**": { isr: false },
    "/api/articles": varyOn("page", "sort", "format", "category", "tag", "author"),
    "/api/articles/**": { isr: ONE_DAY },
    "/api/pages/**": { isr: ONE_DAY },
    "/api/authors": { isr: ONE_DAY },
    "/api/subjects": { isr: ONE_DAY },
    "/api/home": { isr: ONE_DAY },
    "/api/search": varyOn("query", "page"),
    "/api/translations/**": { isr: ONE_DAY },
    "/_i18n/**": { isr: ONE_DAY },
};

// Each one reads nothing from the query string, which a static file can't vary on
const STATIC_ROUTES = [
    "/areas/",
    "/colaboradores/",
    "/calculo-intereses/",
    "/contacto/",
    "/publicar/",
];

const listPostSlugs = async (vendor: VendorConfig): Promise<string[]> => {
    const provider = await createProvider(vendor, new OfetchHttpClient(ofetch));
    const posts = await readAllPages((page) =>
        provider.listEntries("posts", { page, perPage: MAX_PER_PAGE }),
    );

    return posts.map(({ slug }) => slug);
};

export default defineNuxtModule({
    meta: { name: "rendering" },

    setup: (_, nuxt) => {
        for (const [route, rule] of Object.entries(ROUTE_RULES)) extendRouteRules(route, rule);

        // Netlify sets it on every build; CI and e2e build without it, so their pages read the fakes
        if (!process.env.CONTEXT || nuxt.options._prepare || nuxt.options.dev) return;

        nuxt.options.nitro.prerender = { ...nuxt.options.nitro.prerender, failOnError: true };

        nuxt.hook("prerender:routes", async ({ routes }) => {
            const { content, public: config } = nuxt.options.runtimeConfig;
            // The prerendered pages read the override at runtime, so the route list has to as well
            const override = process.env.NUXT_PUBLIC_PAGE_SLUGS;
            const pageSlugs: string[] = override ? JSON.parse(override) : config.pageSlugs;
            const slugs = [...pageSlugs, ...(await listPostSlugs(content.vendor))];

            for (const route of [...STATIC_ROUTES, ...slugs.map((slug) => `/${slug}/`)]) {
                routes.add(route);
            }
        });
    },
});
