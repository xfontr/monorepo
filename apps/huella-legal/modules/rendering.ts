import {
    createProvider,
    MAX_PER_PAGE,
    OfetchHttpClient,
    type VendorConfig,
} from "@monorepo/content";
import type { Nuxt } from "nuxt/schema";
import { defineNuxtModule, extendRouteRules } from "nuxt/kit";
import { ofetch } from "ofetch";
import { readAllPages } from "../layers/articles/server/utils/readAllPages";

type RouteRule = Parameters<typeof extendRouteRules>[1];

interface CachedRule {
    isr: number | false;
    queryKeys?: string[];
}

export interface Rendering {
    cache: Record<string, CachedRule>;
    prerender: string[];
}

// Nuxt copies only `isr` onto a payload path and skips wildcards, so the vary is repeated here
const hasPayload = (route: string, { queryKeys }: CachedRule): boolean =>
    !!queryKeys && !route.startsWith("/api/");

const payloadPath = (route: string): string => {
    const directory = route.endsWith("/") ? route : `${route}/`;

    return `${directory}_payload.json`;
};

const toRouteRule = ({ isr, queryKeys }: CachedRule): RouteRule =>
    queryKeys ? { isr, headers: { "Netlify-Vary": `query=${queryKeys.join("|")}` } } : { isr };

const toRouteRules = (cache: Rendering["cache"]): [string, RouteRule][] =>
    Object.entries(cache).flatMap(([route, rule]) => {
        const routeRule = toRouteRule(rule);

        return hasPayload(route, rule)
            ? [
                  [route, routeRule],
                  [payloadPath(route), routeRule],
              ]
            : [[route, routeRule]];
    });

const listPostSlugs = async (vendor: VendorConfig): Promise<string[]> => {
    const provider = await createProvider(vendor, new OfetchHttpClient(ofetch));
    const posts = await readAllPages((page) =>
        provider.listEntries("posts", { page, perPage: MAX_PER_PAGE }),
    );

    return posts.map(({ slug }) => slug);
};

const listSlugRoutes = async ({ runtimeConfig }: Nuxt["options"]): Promise<string[]> => {
    const { content, public: config } = runtimeConfig;
    // The prerendered pages read both from the env at runtime, so the route list has to as well
    const override = process.env.NUXT_PUBLIC_PAGE_SLUGS;
    const pageSlugs: string[] = override ? JSON.parse(override) : config.pageSlugs;
    const baseURL = process.env.NUXT_CONTENT_VENDOR_BASE_URL || content.vendor.baseURL;
    const slugs = [...pageSlugs, ...(await listPostSlugs({ ...content.vendor, baseURL }))];

    return slugs.map((slug) => `/${slug}/`);
};

export default defineNuxtModule<Rendering>({
    meta: { name: "rendering", configKey: "rendering" },

    defaults: { cache: {}, prerender: [] },

    setup: ({ cache, prerender }, { options, hook }) => {
        for (const [route, rule] of toRouteRules(cache)) extendRouteRules(route, rule);

        // Every deploy sets it; CI and e2e build without it, so their pages read the fakes
        if (!process.env.NUXT_SITE_ENV || options._prepare || options.dev) return;

        options.nitro.prerender = { ...options.nitro.prerender, failOnError: true };

        hook("prerender:routes", async ({ routes }) => {
            for (const route of [...prerender, ...(await listSlugRoutes(options))])
                routes.add(route);
        });
    },
});
