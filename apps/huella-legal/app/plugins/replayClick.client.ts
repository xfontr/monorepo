const PENDING_CLICK = "__pendingClick";

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.hooks.hookOnce("app:suspense:resolve", () => {
        const slot = window as unknown as Record<string, HTMLElement | null | undefined>;
        const control = slot[PENDING_CLICK];

        slot[PENDING_CLICK] = null;

        if (control?.isConnected) control.click();
    });
});
