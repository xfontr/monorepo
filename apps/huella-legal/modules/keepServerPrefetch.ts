import { defineNuxtModule } from "nuxt/kit";

// Vue counts an onServerPrefetch hook (every Nuxt Icon has one) as a useId boundary, so a client
// build that strips it hydrates Reka's aria-controls with ids the server never rendered
export default defineNuxtModule({
    meta: { name: "keep-server-prefetch" },

    setup: (_, { options }) => {
        const { client } = options.optimization.treeShake.composables;
        if (client.vue) client.vue = client.vue.filter((name) => name !== "onServerPrefetch");
    },
});
