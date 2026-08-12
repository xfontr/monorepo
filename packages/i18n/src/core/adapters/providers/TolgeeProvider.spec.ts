import { describe, expect, it, vi } from "vitest";
import TolgeeProvider from "./TolgeeProvider";
import type { HttpClient } from "#core/ports/HttpClient";

const messages = { shared: { health: "Health" } };

describe("TolgeeProvider", () => {
    it("asks Tolgee for the project's locale tree, authenticated with the project token", async () => {
        const get = vi.fn().mockResolvedValue({ "en-GB": messages });
        const http: HttpClient = { get };
        const provider = new TolgeeProvider(
            { baseURL: "https://app.tolgee.io/", project: "1", options: { token: "abc" } },
            http,
        );

        await expect(provider.getTranslations("en-GB")).resolves.toBe(messages);
        expect(get).toHaveBeenCalledWith("/v2/projects/1/translations/en-GB", { headers: { "X-API-Key": "abc" } });
    });
});
