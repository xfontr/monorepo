import { lockStore } from "../adapters/store.ts";

/** One server per store, so a second `dev:api` or built server can't write over the first. */
export default defineNitroPlugin(() => {
    const { store } = useRuntimeConfig().editor;

    if (store) lockStore(store);
});
