import type { RouteLocationRaw } from "vue-router";

export default defineAppConfig({
    nav: {
        publish: { name: "publish" },
        publishThesis: { name: "publish", hash: "#tesis" },
    } as const satisfies Record<string, RouteLocationRaw>,
});
