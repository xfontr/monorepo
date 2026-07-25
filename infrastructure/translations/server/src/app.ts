import { Hono } from "hono";
import { cors } from "hono/cors";
import getTranslations from "./controllers/translations.ts";

export const app = new Hono();

app.use("*", cors({ origin: "*" }));

app.get("/v1/projects/:project/locales/:locale", getTranslations);
