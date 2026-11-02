import type { RouteLocationRaw } from "vue-router";

export default defineAppConfig({
    nav: {
        newsletter: { name: "index", hash: "#newsletter" },
    } as const satisfies Record<string, RouteLocationRaw>,
});
