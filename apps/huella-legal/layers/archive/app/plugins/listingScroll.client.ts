import type { RouterScrollBehavior } from "vue-router";

// Manual fix for https://github.com/nuxt/nuxt/issues/24070
export default defineNuxtPlugin(({ $router }) => {
    let nuxtDefault = $router.options.scrollBehavior;

    const scrollBehavior: RouterScrollBehavior = (to, from, savedPosition) =>
        to.path === from.path && !to.hash && to.query.page !== from.query.page
            ? (savedPosition ?? { top: 0 })
            : nuxtDefault?.(to, from, savedPosition);

    // Nuxt reassigns this after the first navigation, so assignments are caught rather than wrapped once
    Object.defineProperty($router.options, "scrollBehavior", {
        configurable: true,
        enumerable: true,
        get: () => scrollBehavior,
        set: (value?: RouterScrollBehavior) => {
            nuxtDefault = value;
        },
    });
});
