import type { RouteLocationRaw } from "vue-router";

export default defineAppConfig({
    nav: {
        contact: { name: "contact" },
    } as const satisfies Record<string, RouteLocationRaw>,
});
