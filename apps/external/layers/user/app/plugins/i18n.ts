import type { Composer } from "vue-i18n";
import type { UserRole } from "../types/UserRole";

import useUserStore from "../stores/user";

const BASE_PATH = "../../i18n/locales";

const loaders = import.meta.glob<Record<string, string>>("../../i18n/locales/**/*.json", { import: "default" });

function load({ locale }: Composer, key: string) {
    return loaders[`${BASE_PATH}/${locale.value}/${locale.value}${key}`]?.();
}

async function getRoleMessages(
    i18n: Composer,
    role: UserRole,
) {
    return load(i18n, `.${role}.json`);
}

async function mergeMessages({ mergeLocaleMessage, locale }: Composer, messages?: Record<string, string>) {
    if (!messages) return;
    mergeLocaleMessage(locale.value, messages);
}

export default defineNuxtPlugin(async (nuxtApp) => {
    const i18n = nuxtApp.$i18n as Composer;
    const user = useUserStore();

    await user.init();

    if (!user.user) return;

    const role = user.user?.role;

    mergeMessages(i18n, await load(i18n, ".json"));
    mergeMessages(i18n, await getRoleMessages(i18n, role));

    if (import.meta.server) return;

    watch(
        () => [i18n.locale.value, role],
        async () => {
            mergeMessages(i18n, await getRoleMessages(i18n, role));
        },
    );
});
