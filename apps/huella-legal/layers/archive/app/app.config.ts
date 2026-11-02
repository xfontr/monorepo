import type { RouteLocationRaw } from "vue-router";

export default defineAppConfig({
    nav: {
        publications: { name: "publications" },
        subjects: { name: "categories" },
        collaborators: { name: "authors" },
        about: { name: "about" },
    } as const satisfies Record<string, RouteLocationRaw>,
});
