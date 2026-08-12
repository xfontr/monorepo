import { describe, expect, it, vi } from "vitest";
import TestProvider from "./TestProvider";
import type { HttpClient } from "../../ports/HttpClient";

const messages = { shared: { health: "Health" } };

describe("TestProvider", () => {
    it("appends its configured id to the project's locale path", async () => {
        const get = vi.fn().mockResolvedValue(messages);
        const http: HttpClient = { get };
        const provider = new TestProvider({ baseURL: "https://translations.test/", project: "external", options: { id: "abc" } }, http);

        await expect(provider.getTranslations("en-EN")).resolves.toBe(messages);
        expect(get).toHaveBeenCalledWith("en-EN/external/abc");
    });
});
