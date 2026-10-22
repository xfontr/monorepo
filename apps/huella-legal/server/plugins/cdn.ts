import type { H3Error } from "h3";

export default defineNitroPlugin((nitroApp) => {
    // `beforeResponse` never fires for a thrown error, so a 5xx can only be kept out of a CDN here
    nitroApp.hooks.hook("error", (error, { event, tags }) => {
        const { statusCode = 500 } = error as Partial<H3Error>;

        // An SWR refresh fails after its response is sent, and a throw here would stop later hooks
        if (!event || event.node.res.headersSent) return;
        if (!(tags as string[] | undefined)?.includes("request") || statusCode < 500) return;

        setResponseHeader(event, "cache-control", "no-store");
    });
});
