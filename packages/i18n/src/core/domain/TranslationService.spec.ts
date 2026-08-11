import { describe, expect, it, vi } from "vitest";
import { TranslationService } from "./TranslationService";
import TranslationProvider from "../ports/TranslationProvider";

const messages = { shared: { health: "Health" } };

function createProvider() {
    const provider = new TranslationProvider({ baseURL: "https://translations.test/", project: "external", options: {} });
    const getTranslations = vi.spyOn(provider, "getTranslations").mockResolvedValue(messages);

    return { provider, getTranslations };
}

describe("TranslationService", () => {
    it("loads the requested locale from its provider", async () => {
        const { provider, getTranslations } = createProvider();

        await expect(new TranslationService(provider).load("en-EN")).resolves.toBe(messages);
        expect(getTranslations).toHaveBeenCalledWith("en-EN");
    });

    it("propagates a provider failure instead of swallowing it", async () => {
        const { provider, getTranslations } = createProvider();
        const cause = new Error("upstream down");
        getTranslations.mockRejectedValue(cause);

        await expect(new TranslationService(provider).load("en-EN")).rejects.toBe(cause);
    });
});
