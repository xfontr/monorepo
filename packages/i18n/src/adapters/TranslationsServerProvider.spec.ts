import { describe, expect, it, vi } from "vitest";
import type { HttpClient } from "../ports/HttpClient";
import TranslationsServerProvider from "./TranslationsServerProvider";

function fakeHttp(payload: unknown = {}) {
    return { get: vi.fn().mockResolvedValue(payload) } satisfies HttpClient;
}

const requestedUrl = (http: ReturnType<typeof fakeHttp>) => String(http.get.mock.calls[0]?.[0]);

describe("TranslationsServerProvider", () => {
    it("requests a locale from its project and returns the messages", async () => {
        const http = fakeHttp({ shared: { health: "Health" } });
        const provider = new TranslationsServerProvider(http, "external");

        const messages = await provider.getTranslations("en-EN");

        expect(messages).toEqual({ shared: { health: "Health" } });
        expect(requestedUrl(http)).toBe("en-EN/external");
    });

    it("leaves the base url to the injected client", async () => {
        const http = fakeHttp();
        const provider = new TranslationsServerProvider(http, "internal");

        await provider.getTranslations("es-ES");

        expect(requestedUrl(http)).toBe("es-ES/internal");
    });
});
