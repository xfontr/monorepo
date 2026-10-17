import { serve } from "@hono/node-server";
import { app } from "./app.ts";
import { PORT } from "./configs/constants.ts";

serve({ fetch: app.fetch, port: PORT }, (info) => {
    // eslint-disable-next-line no-console -- the dev server announces where it listens
    console.log(`🌐 Translations being served at http://localhost:${info.port}`);
});
