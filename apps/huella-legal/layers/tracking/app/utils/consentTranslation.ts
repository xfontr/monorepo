import type { Translation } from "vanilla-cookieconsent";
import type { ConsentCategory } from "../types/Tracker";

type Translate = (key: string) => string;

export const consentTranslation = (
    t: Translate,
    categories: ConsentCategory[],
    policyHref: string,
): Translation => ({
    consentModal: {
        label: t("cookieConsent.banner.title"),
        title: t("cookieConsent.banner.title"),
        description: t("cookieConsent.banner.description"),
        acceptAllBtn: t("cookieConsent.actions.acceptAll"),
        acceptNecessaryBtn: t("cookieConsent.actions.reject"),
        showPreferencesBtn: t("cookieConsent.actions.configure"),
        footer: `<a href="${policyHref}">${t("cookieConsent.policy")}</a>`,
    },
    preferencesModal: {
        title: t("cookieConsent.preferences.title"),
        acceptAllBtn: t("cookieConsent.actions.acceptAll"),
        acceptNecessaryBtn: t("cookieConsent.actions.reject"),
        savePreferencesBtn: t("cookieConsent.actions.save"),
        closeIconLabel: t("cookieConsent.actions.close"),
        sections: [
            { description: t("cookieConsent.preferences.intro") },
            {
                title: t("cookieConsent.preferences.categories.necessary.title"),
                description: t("cookieConsent.preferences.categories.necessary.description"),
                linkedCategory: "necessary",
            },
            ...categories.map((category) => ({
                title: t(`cookieConsent.preferences.categories.${category}.title`),
                description: t(`cookieConsent.preferences.categories.${category}.description`),
                linkedCategory: category,
            })),
            {
                description: `${t("cookieConsent.preferences.more")} <a href="${policyHref}">${t("cookieConsent.policy")}</a>.`,
            },
        ],
    },
});
