import type { CookieValue } from "vanilla-cookieconsent";
import { TRACKERS, type TrackerKey } from "../trackers";

export default defineNuxtPlugin(() => {
    const { trackers } = useRuntimeConfig().public;

    const accepted = ref<string[]>([]);

    const sync = (event: Event) => {
        accepted.value = (event as CustomEvent<{ cookie: CookieValue }>).detail.cookie.categories;
    };

    window.addEventListener("cc:onConsent", sync);
    window.addEventListener("cc:onChange", sync);

    for (const key of Object.keys(trackers) as TrackerKey[]) {
        const { id } = trackers[key];

        if (!id) continue;

        const consent = computed(() => accepted.value.includes(TRACKERS[key].category));
        TRACKERS[key].load(id, useScriptTriggerConsent({ consent }));
    }
});
