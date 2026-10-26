import { fakeEntry } from "@monorepo/content/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Page } from "../../../shared/types/Page";

const ENTRY = fakeEntry({ slug: "aviso-legal", body: { format: "html", value: "<p>Uno</p>" } });

const nitro = vi.hoisted(() => ({ getEntry: vi.fn(), param: vi.fn() }));

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("getRouterParam", nitro.param);
vi.stubGlobal("createError", (input: { statusCode?: number }) =>
    Object.assign(new Error("http"), input),
);
vi.stubGlobal("useRuntimeConfig", () => ({
    public: { site: { url: "https://revista.test" }, pageSlugs: ["aviso-legal"] },
}));
vi.stubGlobal("useContent", () => ({ getEntry: nitro.getEntry }));

const handler = (await import("./[slug].get")).default as unknown as (
    event: unknown,
) => Promise<Page>;

beforeEach(() => {
    vi.clearAllMocks();
    nitro.param.mockReturnValue("aviso-legal");
    nitro.getEntry.mockResolvedValue(ENTRY);
});

describe("GET /api/pages/:slug", () => {
    // Left encoded, an accented slug would reach WordPress encoded twice and match nothing
    it("reads the page named by the route, its slug decoded", async () => {
        await handler({});

        expect(nitro.param).toHaveBeenCalledWith({}, "slug", { decode: true });
        expect(nitro.getEntry).toHaveBeenCalledWith("pages", "aviso-legal");
    });

    it("returns the entry mapped into a page, addressed on the site", async () => {
        expect(await handler({})).toMatchObject({
            slug: "aviso-legal",
            body: { lead: "<p>Uno</p>" },
            permalink: "https://revista.test/aviso-legal/",
        });
    });

    // Otherwise any WordPress page would go live at a root permalink the moment it was published
    it("answers a 404 for a slug the config doesn't list, without asking WordPress", async () => {
        nitro.param.mockReturnValue("borrador");

        await expect(handler({})).rejects.toMatchObject({ statusCode: 404 });
        expect(nitro.getEntry).not.toHaveBeenCalled();
    });

    it("keeps the content module's status, so a missing page is a 404 and not a 500", async () => {
        nitro.getEntry.mockRejectedValue(Object.assign(new Error("http"), { statusCode: 404 }));

        await expect(handler({})).rejects.toMatchObject({ statusCode: 404 });
    });
});
