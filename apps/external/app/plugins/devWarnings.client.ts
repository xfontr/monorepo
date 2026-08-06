export default defineNuxtPlugin(() => {
    if (!import.meta.env.DEV) return;

    const originalInfo = console.info;

    console.info = (...args) => {
        // Unpatched, known Vue bug - src: https://github.com/nuxt/nuxt/discussions/25973#discussioncomment-12203169
        if (
            typeof args[0] === "string"
            && args[0].includes("<Suspense> is an experimental feature")
        ) {
            return;
        }
        originalInfo(...args);
    };
});
