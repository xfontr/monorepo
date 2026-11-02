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

interface CachedRule {
    isr: number | false;
    // The query keys the route reads, so the CDN keeps one copy per combination of them
    varyOn?: string[];
}

// Only for a route that reads nothing from the query string, which a static file can't vary on
interface PrerenderedRule {
    prerender: true;
}

export type RenderingRule = CachedRule | PrerenderedRule;

export type Rendering = Record<string, RenderingRule>;

const toRouteRule = ({ isr, varyOn }: CachedRule): RouteRule =>
    varyOn ? { isr, headers: { "Netlify-Vary": `query=${varyOn.join("|")}` } } : { isr };

// Nuxt copies only `isr` onto a payload path and skips wildcards, so the vary is repeated here
const payloadPath = (route: string): string =>
    `${route.endsWith("/") ? route : `${route}/`}_payload.json`;

const listPostSlugs = async (vendor: VendorConfig): Promise<string[]> => {
    const provider = await createProvider(vendor, new OfetchHttpClient(ofetch));
    const posts = await readAllPages((page) =>
        provider.listEntries("posts", { page, perPage: MAX_PER_PAGE }),
    );

    return posts.map(({ slug }) => slug);
};

export default defineNuxtModule<Rendering>({
    meta: { name: "rendering", configKey: "rendering" },

    defaults: {},

    setup: (rendering, nuxt) => {
        for (const [route, rule] of Object.entries(rendering)) {
            if ("prerender" in rule) continue;

            extendRouteRules(route, toRouteRule(rule));

            if (rule.varyOn && !route.startsWith("/api/")) {
                extendRouteRules(payloadPath(route), toRouteRule(rule));
            }
        }

        // Netlify sets it on every build; CI and e2e build without it, so their pages read the fakes
        if (!process.env.CONTEXT || nuxt.options._prepare || nuxt.options.dev) return;

        nuxt.options.nitro.prerender = { ...nuxt.options.nitro.prerender, failOnError: true };

        const prerendered = Object.entries(rendering)
            .filter(([, rule]) => "prerender" in rule)
            .map(([route]) => route);

        nuxt.hook("prerender:routes", async ({ routes }) => {
            const { content, public: config } = nuxt.options.runtimeConfig;
            // The prerendered pages read the override at runtime, so the route list has to as well
            const override = process.env.NUXT_PUBLIC_PAGE_SLUGS;
            const pageSlugs: string[] = override ? JSON.parse(override) : config.pageSlugs;
            const slugs = [...pageSlugs, ...(await listPostSlugs(content.vendor))];

            for (const route of [...prerendered, ...slugs.map((slug) => `/${slug}/`)]) {
                routes.add(route);
            }
        });
    },
});
