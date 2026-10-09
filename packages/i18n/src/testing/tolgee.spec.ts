import { setupServer } from "msw/node";
import { ofetch } from "ofetch";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { OfetchHttpClient } from "#core/adapters/clients/OfetchHttpClient";
import { UpstreamError } from "#core/domain/errors";
import createProvider from "#core/registry";
import { tolgeeHandlers } from "./tolgee";

const BASE_URL = "https://tms.test";

const ES = { meta: { title: "Huella Legal" }, shared: { health: "Salud" } };

const server = setupServer(...tolgeeHandlers(BASE_URL, { "es-ES": ES }));

// The real provider on the real client, so the fake is held to what TolgeeProvider parses
const provider = () =>
    createProvider(
        {
            name: "tolgee",
            baseURL: BASE_URL,
            project: "huella-legal",
            options: { token: "tgpak_test" },
        },
        new OfetchHttpClient(ofetch.create({ baseURL: BASE_URL })),
    );

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterAll(() => server.close());

describe("the fake Tolgee", () => {
    it("serves a locale's messages in the shape the provider unwraps", async () => {
        await expect((await provider()).getTranslations("es-ES")).resolves.toEqual(ES);
    });

    it("answers a locale it was given no messages for with a 404", async () => {
        const failure = (await provider()).getTranslations("fr-FR");

        await expect(failure).rejects.toBeInstanceOf(UpstreamError);
        await expect(failure).rejects.toMatchObject({ upstreamStatus: 404 });
    });
});
