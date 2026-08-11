import { describe, expect, it, vi } from "vitest";
import InternalProvider from "./InternalProvider";
import type { HttpClient } from "../../ports/HttpClient";

const messages = { shared: { health: "Health" } };

describe("InternalProvider", () => {
    it("asks the translations server for the project's locale tree", async () => {
        const get = vi.fn().mockResolvedValue(messages);
        const http: HttpClient = { get };
        const provider = new InternalProvider({ baseURL: "https://translations.test/", project: "external", options: {} });

        await expect(provider.setHttpClient(http).getTranslations("en-EN")).resolves.toBe(messages);
        expect(get).toHaveBeenCalledWith("en-EN/external");
    });
});
