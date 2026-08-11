import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EventHandlerRequest, H3Event } from "h3";
import type { CachedEventHandlerOptions } from "nitropack";
import type { VendorConfig } from "../../../core/registry";
import type { TranslationMap } from "../../../core/domain/translations";

const nitro = vi.hoisted(() => ({
    vendor: undefined as VendorConfig | undefined,
    cache: undefined as CachedEventHandlerOptions<TranslationMap> | undefined,
}));

const ofetch = vi.hoisted(() => ({
    create: vi.fn(),
    request: vi.fn(),
}));

vi.mock("nitropack/runtime", () => ({
    defineCachedEventHandler: (handler: unknown, options: CachedEventHandlerOptions<TranslationMap>) => {
        nitro.cache = options;
        return handler;
    },
    useRuntimeConfig: () => ({ translations: { vendor: nitro.vendor } }),
}));

vi.mock("ofetch", () => ({ ofetch: { create: ofetch.create } }));

const handler = (await import("./translations.get")).default as unknown as (event: H3Event<EventHandlerRequest>) => Promise<TranslationMap>;

const messages = { shared: { health: "Health" } };

function createEvent(locale?: string) {
    return { context: { params: locale === undefined ? {} : { locale } } } as unknown as H3Event<EventHandlerRequest>;
}

beforeEach(() => {
    vi.clearAllMocks();
    nitro.vendor = { name: "internal", baseURL: "https://translations.test/", project: "external" };
    ofetch.create.mockReturnValue(ofetch.request);
    ofetch.request.mockResolvedValue(messages);
});

describe("GET /api/translations/:locale", () => {
    it("serves the locale tree fetched from the configured vendor", async () => {
        await expect(handler(createEvent("en-EN"))).resolves.toBe(messages);

        expect(ofetch.create).toHaveBeenCalledWith({ baseURL: "https://translations.test/" });
        expect(ofetch.request).toHaveBeenCalledWith("en-EN/external");
    });

    it("404s a request without a locale", async () => {
        await expect(handler(createEvent())).rejects.toMatchObject({ statusCode: 404 });
        expect(ofetch.request).not.toHaveBeenCalled();
    });

    it("500s when the configured vendor does not exist", async () => {
        nitro.vendor = { name: "nope", baseURL: "https://translations.test/", project: "external" } as unknown as VendorConfig;

        await expect(handler(createEvent("en-EN"))).rejects.toMatchObject({ statusCode: 500 });
    });

    it("502s when the vendor is unreachable, keeping the failure as the cause", async () => {
        const cause = new Error("upstream down");
        ofetch.request.mockRejectedValue(cause);

        await expect(handler(createEvent("en-EN"))).rejects.toMatchObject({ statusCode: 502, cause });
    });
});

describe("translations cache", () => {
    it("keys entries by vendor, project and locale so tenants never share a payload", () => {
        expect(nitro.cache?.getKey?.(createEvent("en-EN"))).toBe("internal:external:en-EN");

        nitro.vendor = { name: "test", baseURL: "https://translations.test/", project: "internal", options: { id: "abc" } };
        expect(nitro.cache?.getKey?.(createEvent("es-ES"))).toBe("test:internal:es-ES");
    });

    it("caches outside of dev", () => {
        expect(nitro.cache?.shouldBypassCache?.(createEvent("en-EN"))).toBe(false);
    });
});
