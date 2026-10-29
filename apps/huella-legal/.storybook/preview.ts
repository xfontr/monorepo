import "../layers/design/app/assets/main.css";

import UApp from "@nuxt/ui/components/App.vue";
import ui from "@nuxt/ui/vue-plugin";
import { setup, type Preview } from "@storybook/vue3-vite";
import { sb } from "storybook/test";
import { h } from "vue";
import { createI18n } from "vue-i18n";
import { createMemoryHistory, createRouter } from "vue-router";

// Mirrors the `definePageMeta` names and paths of the pages that components link to by name
const routes = [
    { name: "index", path: "/" },
    { name: "publications", path: "/publicaciones/" },
    { name: "publish", path: "/publicar/" },
    { name: "search", path: "/buscar/" },
    { name: "authors", path: "/colaboradores/" },
    { name: "categories", path: "/areas/" },
    { name: "article", path: "/:slug/" },
    { name: "author", path: "/colaboradores/:slug/" },
    { name: "category", path: "/areas/:slug/" },
].map((route) => ({ ...route, component: { render: () => null } }));

// Swapped for its `__mocks__` copy, so a story's form never posts; Storybook restores the copy's
// idle default before each story
sb.mock("../layers/newsletter/app/composables/useNewsletter.ts");

setup((app) => {
    // FormChallenge mounts the module's widget on focus, which would load Cloudflare's script
    app.component("NuxtTurnstile", { render: () => null });
    // The real one needs Nuxt Image's runtime, so a story loads the original file instead
    app.component("NuxtImg", (_props, { attrs }) => h("img", attrs));
    app.use(ui);
    app.use(createRouter({ history: createMemoryHistory(), routes }));
    app.use(
        createI18n({
            legacy: false,
            locale: "es-ES",
            messages: { "es-ES": __MESSAGES__ },
            datetimeFormats: __DATETIME_FORMATS__,
        }),
    );
});

const preview: Preview = {
    // A string template is compiled at runtime, out of reach of Nuxt UI's component auto-import
    decorators: [() => ({ components: { UApp }, template: "<UApp><story /></UApp>" })],
};

export default preview;
