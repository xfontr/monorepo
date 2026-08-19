import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EventHandlerRequest, H3Event } from "h3";
import type { CachedEventHandlerOptions } from "nitropack";
import type { VendorConfig } from "#core/registry";
import type { Locale, TranslationMap } from "#core/domain/translations";
import { translationsKey } from "#core/translationsKey";

const nitro = vi.hoisted(() => ({
    vendor: undefined as VendorConfig | undefined,
    locales: [] as Locale[],
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
    useRuntimeConfig: () => ({ translations: { vendor: nitro.vendor, locales: nitro.locales } }),
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
    nitro.locales = ["en-GB", "es-ES"];
    ofetch.create.mockReturnValue(ofetch.request);
    ofetch.request.mockResolvedValue(messages);
});

describe("GET /api/translations/:locale", () => {
    it("serves the locale tree fetched from the configured vendor", async () => {
        await expect(handler(createEvent("en-GB"))).resolves.toBe(messages);

        expect(ofetch.create).toHaveBeenCalledWith({ baseURL: "https://translations.test/" });
        expect(ofetch.request).toHaveBeenCalledWith("en-GB/external", { headers: undefined });
    });

    it("404s a request without a locale", async () => {
        await expect(handler(createEvent())).rejects.toMatchObject({ statusCode: 404 });
        expect(ofetch.request).not.toHaveBeenCalled();
    });

    it("404s a locale the app does not declare, without asking the vendor for it", async () => {
        await expect(handler(createEvent("fr-FR"))).rejects.toMatchObject({ statusCode: 404 });
        expect(ofetch.request).not.toHaveBeenCalled();
    });

    it("serves every declared locale, not just the first", async () => {
        await expect(handler(createEvent("es-ES"))).resolves.toBe(messages);

        expect(ofetch.request).toHaveBeenCalledWith("es-ES/external", { headers: undefined });
    });

    it("500s when the configured vendor does not exist", async () => {
        nitro.vendor = { name: "nope", baseURL: "https://translations.test/", project: "external" } as unknown as VendorConfig;

        await expect(handler(createEvent("en-GB"))).rejects.toMatchObject({ statusCode: 500 });
    });

    // Unset env vars used to reach the vendor as an empty base URL and come back as a 502
    it("500s unset vendor config, naming what is missing instead of blaming the vendor", async () => {
        nitro.vendor = { name: "tolgee", baseURL: "", project: "", options: { token: "" } };

        await expect(handler(createEvent("en-GB"))).rejects.toMatchObject({
            statusCode: 500,
            statusMessage: expect.stringContaining("options.token is empty") as unknown as string,
        });

        expect(ofetch.request).not.toHaveBeenCalled();
    });

    // The vendor answered, so it did not fail — flattening this into a 502 used to blame it for a
    // locale our own config claimed
    it("keeps the status of a failure it diagnosed, rather than reporting it as a vendor failure", async () => {
        nitro.vendor = { name: "tolgee", baseURL: "https://app.tolgee.io/", project: "1", options: { token: "abc" } };
        ofetch.request.mockResolvedValue({ "es-ES": messages });

        await expect(handler(createEvent("en-GB"))).rejects.toMatchObject({
            statusCode: 500,
            statusMessage: expect.stringContaining("does not exist for Tolgee") as unknown as string,
        });
    });

    it("502s when the vendor is unreachable, keeping the failure as the cause", async () => {
        const cause = new Error("upstream down");
        ofetch.request.mockRejectedValue(cause);

        await expect(handler(createEvent("en-GB"))).rejects.toMatchObject({ statusCode: 502, cause });
    });

    // Last: it resets the module registry, so the providers a later test loads lazily would no longer
    // share an error class with the handler imported above
    it("lets a failure it cannot diagnose through untouched, rather than blaming the vendor", async () => {
        const cause = new Error("adapter is broken");
        vi.doMock("#core/registry", () => ({ default: () => Promise.reject(cause) }));
        vi.resetModules();

        const broken = (await import("./translations.get")).default as unknown as (event: H3Event<EventHandlerRequest>) => Promise<TranslationMap>;

        await expect(broken(createEvent("en-GB"))).rejects.toBe(cause);

        vi.doUnmock("#core/registry");
        vi.resetModules();
    });
});

// Key derivation itself lives in core and is covered by core/translationsKey.spec.ts
describe("translations cache", () => {
    it("keys entries off the configured vendor and the requested locale", () => {
        expect(nitro.cache?.getKey?.(createEvent("en-GB"))).toBe(translationsKey(nitro.vendor!, "en-GB"));
    });

    it("404s a key lookup without a locale, so a bad request cannot poison an entry", () => {
        expect(() => nitro.cache?.getKey?.(createEvent())).toThrow(expect.objectContaining({ statusCode: 404 }) as Error);
    });

    // The key is derived before the handler runs, so this is what bounds the keyspace to the declared locales
    it("404s a key lookup for an undeclared locale, so it cannot mint an entry of its own", () => {
        expect(() => nitro.cache?.getKey?.(createEvent("fr-FR"))).toThrow(expect.objectContaining({ statusCode: 404 }) as Error);
    });

    it("caches outside of dev", () => {
        expect(nitro.cache?.shouldBypassCache?.(createEvent("en-GB"))).toBe(false);
    });
});
