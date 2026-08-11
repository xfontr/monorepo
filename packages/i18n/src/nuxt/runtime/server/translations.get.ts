import type { EventHandlerRequest, H3Event } from "h3";
import { createError, getRouterParam } from "h3";
import { defineCachedEventHandler, useRuntimeConfig } from "nitropack/runtime";
import { TranslationService } from "../../../application/TranslationService";
import { HTTP_BAD_GATEWAY, HTTP_BAD_REQUEST, HTTP_INTERNAL_SERVER_ERROR } from "../../shared";
import type { CachedEventHandlerOptions } from "nitropack";
import type { TranslationMap } from "../../../domain/translations";
import getVendor from "../../../vendors";

const cacheOptions: CachedEventHandlerOptions<Promise<TranslationMap>> = {
    name: "translations",
    group: "i18n",
    maxAge: 60 * 60,
    staleMaxAge: 60 * 60 * 24,
    getKey,
    shouldBypassCache: () => import.meta.dev === true,
};

export default defineCachedEventHandler(async (event) => {
    const locale = getRouterParam(event, "locale");
    assertLocale(locale);

    const provider = await getVendor(useRuntimeConfig(event))
        .then((vendor) => vendor)
        .catch(throwInternalServerError);

    const service = new TranslationService(provider);

    return service
        .load(locale)
        .catch((cause) => throwBadGatewayError(cause, locale));
}, cacheOptions);

// #region utils
function assertLocale(locale?: string): asserts locale is string {
    if (locale) return;

    throw createError({
        statusCode: HTTP_BAD_REQUEST,
        statusMessage: "Undefined locale",
    });
}

function throwBadGatewayError(cause: unknown, locale: string): never {
    throw createError({
        statusCode: HTTP_BAD_GATEWAY,
        statusMessage: `Translations unavailable for "${locale}"`,
        cause,
    });
}

function throwInternalServerError(cause: unknown): never {
    throw createError({
        statusCode: HTTP_INTERNAL_SERVER_ERROR,
        statusMessage: "The requested vendor does not exist",
        cause,
    });
}

function getKey(event: H3Event<EventHandlerRequest>) {
    const locale = getRouterParam(event, "locale");
    assertLocale(locale);
    return locale;
}
// #endregion
