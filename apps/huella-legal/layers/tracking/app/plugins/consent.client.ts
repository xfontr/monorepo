import type { TrackerKey } from "../trackers";

export default defineNuxtPlugin(({ $i18n }) => {
    const { trackers } = useRuntimeConfig().public;
    const active = (Object.keys(trackers) as TrackerKey[]).filter((key) => trackers[key].id);

    if (!active.length) return;

    const policyHref = useRouter().resolve(useAppConfig().nav.cookies).href;

    onNuxtReady(async () => {
        const [CookieConsent, { TRACKERS }] = await Promise.all([
            import("vanilla-cookieconsent"),
            import("../trackers"),
            import("../assets/consent.css"),
        ]);
        const categories = [...new Set(active.map((key) => TRACKERS[key].category))];

        await CookieConsent.run({
            guiOptions: {
                consentModal: { layout: "box", position: "bottom left", equalWeightButtons: true },
                preferencesModal: { layout: "box", equalWeightButtons: true },
            },
            categories: {
                necessary: { enabled: true, readOnly: true },
                ...Object.fromEntries(
                    categories.map((category) => [
                        category,
                        {
                            autoClear: {
                                cookies: active
                                    .filter((key) => TRACKERS[key].category === category)
                                    .flatMap((key) => TRACKERS[key].cookies)
                                    .map((name) => ({ name })),
                                reloadPage: true,
                            },
                        },
                    ]),
                ),
            },
            language: {
                default: "es",
                translations: {
                    es: consentTranslation($i18n.t, categories, policyHref),
                },
            },
        });
    });
});
