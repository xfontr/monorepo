import { describe, expect, it } from "vitest";
import { app } from "./app.ts";

const get = (path: string) => app.request(path);

describe("GET /v1/projects/:project/locales/:locale", () => {
    it("serves the full locale tree when no namespaces are requested", async () => {
        const res = await get("/v1/projects/external/locales/en-EN");
        expect(res.status).toBe(200);
        const body = (await res.json()) as Record<string, unknown>;
        expect(Object.keys(body)).toEqual(
            expect.arrayContaining(["shared", "meta", "user"]),
        );
    });

    it("honours the namespaces query end-to-end", async () => {
        const res = await get("/v1/projects/external/locales/en-EN?namespaces=shared");
        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toEqual({ shared: { health: "Health" } });
    });

    it("404s an unknown locale", async () => {
        expect((await get("/v1/projects/external/locales/zz")).status).toBe(404);
    });

    it("400s an unsafe path segment", async () => {
        expect((await get("/v1/projects/..%2Fetc/locales/en-EN")).status).toBe(400);
    });
});
