import type { H3Error } from "h3";

export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook("error", (error, { event }) => {
        const { statusCode = 500 } = error as Partial<H3Error>;

        if (!event || statusCode < 500) return;

        setResponseHeader(event, "netlify-cdn-cache-control", "no-store");
    });
});
