const WORDPRESS_PATHS = /^\/(?:wp-content\/|wp-admin(?:\/|$)|wp-login\.php$|wp-json(?:\/|$))/;

export default defineEventHandler((event) => {
    const url = getRequestURL(event);

    if (url.pathname === "/" && url.searchParams.has("s")) {
        const query = new URLSearchParams({ query: url.searchParams.get("s") ?? "" });
        return sendRedirect(event, `/buscar/?${query}`, 301);
    }

    if (!WORDPRESS_PATHS.test(url.pathname)) return;

    const { baseURL } = useRuntimeConfig(event).content.vendor;

    if (new URL(baseURL).host === url.host) return;

    return sendRedirect(event, `${baseURL.replace(/\/+$/, "")}${url.pathname}${url.search}`, 301);
});
