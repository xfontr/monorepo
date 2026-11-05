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

interface CachedRule {
    isr: number | false;
}

export interface Rendering {
    cache: Record<string, CachedRule>;
    prerender: string[];
}

const listPostSlugs = async (vendor: VendorConfig): Promise<string[]> => {
    const provider = await createProvider(vendor, new OfetchHttpClient(ofetch));
    const posts = await readAllPages((page) =>
        provider.listEntries("posts", { page, perPage: MAX_PER_PAGE }),
    );

    return posts.map(({ slug }) => slug);
};

const listSlugRoutes = async ({ runtimeConfig }: Nuxt["options"]): Promise<string[]> => {
    const { content, public: config } = runtimeConfig;
    // The prerendered pages read the override at runtime, so the route list has to as well
    const override = process.env.NUXT_PUBLIC_PAGE_SLUGS;
    const pageSlugs: string[] = override ? JSON.parse(override) : config.pageSlugs;
    const slugs = [...pageSlugs, ...(await listPostSlugs(content.vendor))];

    return slugs.map((slug) => `/${slug}/`);
};

export default defineNuxtModule<Rendering>({
    meta: { name: "rendering", configKey: "rendering" },

    defaults: { cache: {}, prerender: [] },

    setup: ({ cache, prerender }, { options, hook }) => {
        for (const [route, { isr }] of Object.entries(cache)) extendRouteRules(route, { isr });

        // Every deploy sets it; CI and e2e build without it, so their pages read the fakes
        if (!process.env.NUXT_SITE_ENV || options._prepare || options.dev) return;

        options.nitro.prerender = { ...options.nitro.prerender, failOnError: true };

        hook("prerender:routes", async ({ routes }) => {
            for (const route of [...prerender, ...(await listSlugRoutes(options))])
                routes.add(route);
        });
    },
});
