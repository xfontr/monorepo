import { beforeEach } from "vitest";

// Every `t()` misses unless a spec merges its own messages in a later `beforeEach`, so specs assert
// on keys rather than on copy
beforeEach(() => {
    const { $i18n } = useNuxtApp();
    $i18n.setLocaleMessage($i18n.locale.value, {});
    $i18n.missingWarn = false;
});
