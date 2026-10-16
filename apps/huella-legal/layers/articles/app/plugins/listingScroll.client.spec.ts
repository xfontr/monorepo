import { describe, expect, it } from "vitest";
import type { RouteLocationNormalized } from "vue-router";

const at = (fullPath: string): RouteLocationNormalized => {
    const url = new URL(fullPath, "http://huella.test");

    return {
        path: url.pathname,
        fullPath,
        hash: url.hash,
        query: Object.fromEntries(url.searchParams),
        meta: {},
    } as RouteLocationNormalized;
};

// Runs against the router the Nuxt environment built, so the plugin and Nuxt's default are both real
const scroll = (to: string, from: string, saved: { left: number; top: number } | null = null) =>
    useRouter().options.scrollBehavior?.(at(to), at(from), saved);

describe("listing scroll", () => {
    it("goes back to the top when a listing changes page, since only its query changed", () => {
        expect(scroll("/publicaciones/?page=2", "/publicaciones/")).toEqual({ top: 0 });
        expect(scroll("/publicaciones/", "/publicaciones/?page=2")).toEqual({ top: 0 });
    });

    it("restores the reader's place when the back button returns to an earlier page", () => {
        const saved = { left: 0, top: 1800 };

        expect(scroll("/publicaciones/", "/publicaciones/?page=2", saved)).toBe(saved);
    });

    it("leaves a re-sort or re-filter to Nuxt, which keeps the controls under the pointer", () => {
        expect(scroll("/publicaciones/?sort=oldest", "/publicaciones/")).toBe(false);
        expect(scroll("/publicaciones/?format=ensayo", "/publicaciones/?sort=oldest")).toBe(false);
    });

    it("leaves in-page anchors to Nuxt", () => {
        expect(scroll("/la-culpa/#notas", "/la-culpa/")).toMatchObject({ el: "#notas" });
    });
});
