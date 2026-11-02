export const useCookiePreferences = () => {
    const { trackers } = useRuntimeConfig().public;

    return {
        enabled: Object.values(trackers).some(({ id }) => id),
        open: async () => (await import("vanilla-cookieconsent")).showPreferences(),
    };
};
