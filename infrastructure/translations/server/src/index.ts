import { serve } from "@hono/node-server";
import { app } from "./app.ts";
import { PORT } from "./configs/constants.ts";

serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`🌐 Translations being served at http://localhost:${info.port}`);
});
