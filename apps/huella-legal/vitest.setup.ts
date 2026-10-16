import { registerEndpoint } from "@nuxt/test-utils/runtime";
import { beforeEach } from "vitest";

registerEndpoint("/api/translations/es-ES", () => ({}));

// The bundle above is empty, so every `t()` misses, and specs assert on the key it falls back to
beforeEach(() => {
    useNuxtApp().$i18n.missingWarn = false;
});
