import type { RouteLocationRaw } from "vue-router";

export default defineAppConfig({
    nav: {
        interestCalculator: { name: "interestCalculator" },
    } as const satisfies Record<string, RouteLocationRaw>,
});
