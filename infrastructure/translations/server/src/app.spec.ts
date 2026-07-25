import { describe, expect, it } from "vitest";
import { app } from "./app.ts";

const get = (path: string) => app.request(path);

describe("GET /:locale/:project", () => {
    it("serves the full locale tree when no namespaces are requested", async () => {
        const res = await get("/en-EN/external");
        expect(res.status).toBe(200);
        const body = (await res.json()) as Record<string, unknown>;
        expect(Object.keys(body)).toEqual(
            expect.arrayContaining(["shared", "meta", "user"]),
        );
    });

    it("honours the namespaces query end-to-end", async () => {
        const res = await get("/en-EN/external?namespaces=shared");
        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toEqual({ shared: { health: "Health" } });
    });

    it("404s an unknown locale", async () => {
        expect((await get("/zz/external")).status).toBe(404);
    });

    it("400s an unsafe path segment", async () => {
        expect((await get("/..%2Fetc/external")).status).toBe(400);
    });
});
