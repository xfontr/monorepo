import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRANSLATIONS_API_PATH } from "#nuxt/config";

const messages = { shared: { health: "Health" } };

const $fetch = vi.fn();

vi.stubGlobal("defineI18nLocale", (loader: unknown) => loader);
vi.stubGlobal("$fetch", $fetch);

const load = (await import("./loader")).default;

beforeEach(() => {
    vi.clearAllMocks();
});

describe("locale loader", () => {
    it("loads the messages from the BFF", async () => {
        $fetch.mockResolvedValue(messages);

        await expect(load("en-GB")).resolves.toBe(messages);
        expect($fetch).toHaveBeenCalledWith(`${TRANSLATIONS_API_PATH}/en-GB`);
    });

    it("lets failures through, as i18n turns them into a failed messages request", async () => {
        const cause = new Error("BFF is down");
        $fetch.mockRejectedValue(cause);

        await expect(load("en-GB")).rejects.toBe(cause);
    });
});
