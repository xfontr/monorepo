import { registerEndpoint } from "@nuxt/test-utils/runtime";

// The i18n plugin fetches messages while the test app boots, and nothing serves the BFF under Vitest
registerEndpoint("/api/translations/es-ES", () => ({}));
