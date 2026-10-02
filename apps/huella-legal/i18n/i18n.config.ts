export default defineI18nConfig(() => ({
    datetimeFormats: {
        "es-ES": {
            // Pinned to the journal's zone so the server and the browser print the same day
            long: { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" },
        },
    },
}));
