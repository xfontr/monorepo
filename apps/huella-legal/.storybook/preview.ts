import "../app/assets/css/main.css";

import ui from "@nuxt/ui/vue-plugin";
import { setup, type Preview } from "@storybook/vue3-vite";
import { createI18n } from "vue-i18n";

setup((app) => {
    app.use(ui);
    app.use(createI18n({ legacy: false, locale: "es-ES", messages: { "es-ES": __MESSAGES__ } }));
});

const preview: Preview = {
    decorators: [() => ({ template: "<UApp><story /></UApp>" })],
};

export default preview;
