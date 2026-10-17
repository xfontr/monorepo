import type { H3Error } from "h3";

export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook("error", (error, { event, tags }) => {
        const { statusCode = 500, unhandled, fatal } = error as Partial<H3Error>;

        // Nitro already prints an unhandled or fatal error, and its cache prints its own failures
        if (!event || !(tags as string[] | undefined)?.includes("request")) return;
        if (unhandled || fatal || statusCode < 500) return;

        // eslint-disable-next-line no-console -- a handled 5xx is otherwise invisible in the server log
        console.error(`[request error] [handled] [${event.method}] ${event.path}\n`, error);
    });
});
