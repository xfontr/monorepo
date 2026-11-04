import { beforeEach, describe, expect, it, vi } from "vitest";

const nitro = vi.hoisted(() => ({
    wordpress: "https://cms.revista.test",
    redirect: vi.fn((_event: unknown, location: string, status: number) => ({ location, status })),
}));

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("getRequestURL", (event: { url: string }) => new URL(event.url));
vi.stubGlobal("sendRedirect", nitro.redirect);
vi.stubGlobal("useRuntimeConfig", () => ({ content: { vendor: { baseURL: nitro.wordpress } } }));

const handler = (await import("./legacy")).default as unknown as (event: {
    url: string;
}) => { location: string; status: number } | undefined;

const request = (path: string) => handler({ url: `https://www.revista.test${path}` });

beforeEach(() => {
    vi.clearAllMocks();
    nitro.wordpress = "https://cms.revista.test";
});

describe("legacy middleware", () => {
    it("moves WordPress's search to the app's, keeping the term", () => {
        expect(request("/?s=prisión+provisional")).toEqual({
            location: "/buscar/?query=prisi%C3%B3n+provisional",
            status: 301,
        });
    });

    it.each([
        "/wp-content/uploads/2021/03/foto.jpg",
        "/wp-admin/",
        "/wp-admin",
        "/wp-login.php",
        "/wp-json/wp/v2/posts?per_page=1",
    ])("sends %s to WordPress's own host, so old images and logins keep working", (path) => {
        expect(request(path)).toEqual({ location: `https://cms.revista.test${path}`, status: 301 });
    });

    // Before cutover WordPress still answers on `www`, so forwarding there would loop
    it("keeps the path of a WordPress installed below the root", () => {
        nitro.wordpress = "https://cms.revista.test/wordpress/";

        expect(request("/wp-login.php")?.location).toBe(
            "https://cms.revista.test/wordpress/wp-login.php",
        );
    });

    it("forwards nothing while WordPress shares this host", () => {
        nitro.wordpress = "https://www.revista.test";

        expect(request("/wp-content/uploads/foto.jpg")).toBeUndefined();
    });

    it.each(["/", "/?page=2", "/wp-contenido/", "/wp-login.php.bak", "/articulo/?s=x"])(
        "leaves %s to the app",
        (path) => {
            expect(request(path)).toBeUndefined();
            expect(nitro.redirect).not.toHaveBeenCalled();
        },
    );
});
