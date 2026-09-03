import { describe, expect, it } from "vitest";
import { app } from "./app.ts";

const get = (path: string) => app.request(path);

describe("GET /health", () => {
    it("reports the server as up", async () => {
        const res = await get("/health");
        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toEqual({ status: "ok" });
    });
});

describe("GET /:locale/:project", () => {
    it("serves the locale tree", async () => {
        const res = await get("/en-GB/huella-legal");
        expect(res.status).toBe(200);
        const body = (await res.json()) as Record<string, unknown>;
        expect(Object.keys(body)).toEqual(
            expect.arrayContaining(["shared", "meta", "user"]),
        );
    });

    it("404s an unknown locale", async () => {
        expect((await get("/zz/huella-legal")).status).toBe(404);
    });

    it("400s an unsafe path segment", async () => {
        expect((await get("/..%2Fetc/huella-legal")).status).toBe(400);
    });
});
