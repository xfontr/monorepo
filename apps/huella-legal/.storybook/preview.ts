import "../app/assets/css/main.css";

import ui from "@nuxt/ui/vue-plugin";
import { setup, type Preview } from "@storybook/vue3-vite";

setup((app) => {
    app.use(ui);
});

const preview: Preview = {
    decorators: [() => ({ template: "<UApp><story /></UApp>" })],
};

export default preview;
