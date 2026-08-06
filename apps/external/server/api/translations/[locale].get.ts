import { TranslationService, TranslationsServerProvider } from "@budget-forecast/i18n";
import { OfetchHttpClient } from "~~/i18n/adapters/ofetchHttpClient";
import {
    TRANSLATIONS_MAX_AGE,
    TRANSLATIONS_PROJECT,
    TRANSLATIONS_STALE_MAX_AGE,
} from "~~/i18n/config";
import { HTTP_BAD_GATEWAY, HTTP_BAD_REQUEST } from "~~/server/configs/httpCodes";
import type { H3Event } from "h3";

export default defineCachedEventHandler(async (event) => {
    const locale = getRouterParam(event, "locale");
    assertLocale(locale);

    const provider = getServerProvider(); // Switch with the desired vendor 🤝
    const service = new TranslationService(provider);

    try {
        return await service.load(locale);
    }
    catch (cause) {
        throwBadGatewayError(locale, cause);
    }
}, {
    name: "translations",
    group: "i18n",
    maxAge: TRANSLATIONS_MAX_AGE,
    staleMaxAge: TRANSLATIONS_STALE_MAX_AGE,
    getKey,
    shouldBypassCache: () => import.meta.dev === true,
});

// #region utils
function assertLocale(locale?: string): asserts locale is string {
    if (locale) return;

    throw createError({
        statusCode: HTTP_BAD_REQUEST,
        statusMessage: "Undefined locale",
    });
}

function throwBadGatewayError(locale: string, cause: unknown): never {
    throw createError({
        statusCode: HTTP_BAD_GATEWAY,
        statusMessage: `Translations unavailable for "${locale}"`,
        cause,
    });
}

function getServerProvider(): TranslationsServerProvider {
    const { tmsBaseURL } = useRuntimeConfig();

    return new TranslationsServerProvider(
        new OfetchHttpClient($fetch.create({ baseURL: tmsBaseURL })),
        TRANSLATIONS_PROJECT,
    );
}

function getKey(event: H3Event<globalThis.EventHandlerRequest>) {
    const locale = getRouterParam(event, "locale");
    assertLocale(locale);
    return locale;
}
// #endregion
