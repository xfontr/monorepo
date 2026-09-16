/**
 * Nuxt applies the app's base to neither an `iframe` `src` nor an `external` link, so a
 * root-absolute `public/` URL 404s anywhere the site is not served from the domain root.
 */
export function embedUrl(path: string): string {
    return `${useRuntimeConfig().app.baseURL.replace(/\/$/, "")}${path}`;
}
