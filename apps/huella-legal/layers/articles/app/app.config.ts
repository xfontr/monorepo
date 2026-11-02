import type { RouteLocationRaw } from "vue-router";

export default defineAppConfig({
    nav: {
        legalNotice: { name: "article", params: { slug: "aviso-legal" } },
        privacy: { name: "article", params: { slug: "aviso-legal" }, hash: "#privacidad" },
        cookies: { name: "article", params: { slug: "aviso-legal" }, hash: "#cookies" },
    } as const satisfies Record<string, RouteLocationRaw>,
});
