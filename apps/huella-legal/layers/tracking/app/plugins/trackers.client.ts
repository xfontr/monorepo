import type { CookieValue } from "vanilla-cookieconsent";
import type { TrackerKey } from "../trackers";

export default defineNuxtPlugin(async (nuxtApp) => {
    const { trackers } = useRuntimeConfig().public;
    const active = (Object.keys(trackers) as TrackerKey[]).filter((key) => trackers[key].id);

    if (!active.length) return;

    const stored = useCookie<{ categories?: string[] } | null>("cc_cookie", { readonly: true });
    const accepted = ref<string[]>(stored.value?.categories ?? []);

    const sync = (event: Event) => {
        accepted.value = (event as CustomEvent<{ cookie: CookieValue }>).detail.cookie.categories;
    };

    window.addEventListener("cc:onConsent", sync);
    window.addEventListener("cc:onChange", sync);

    const { TRACKERS } = await import("../trackers");

    for (const key of active) {
        const consent = computed(() => accepted.value.includes(TRACKERS[key].category));
        const send = TRACKERS[key].load(trackers[key].id, useScriptTriggerConsent({ consent }));

        nuxtApp.hook("analytics:event", (event) => {
            if (consent.value) send(event);
        });
    }
});
