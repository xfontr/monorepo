import type { EventHandlerRequest, H3Event } from "h3";
import { createError, getRouterParam } from "h3";
import { defineCachedEventHandler, useRuntimeConfig } from "nitropack/runtime";
import type { CachedEventHandlerOptions } from "nitropack";
import getVendor, { type VendorConfig } from "../../../core/registry";
import { TranslationService } from "../../../core/domain/TranslationService";
import type { TranslationMap } from "../../../core/domain/translations";
import { OfetchHttpClient } from "../../../core/adapters/OfetchHttpClient";
import { TranslationsUnavailableError, UndefinedLocaleError, UndefinedVendorError } from "../../../core/domain/errors";

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

    const { vendor } = useRuntimeConfig(event).translations as { vendor: VendorConfig };

    const provider = await getVendor(vendor)
        .then((vendor) => vendor)
        .catch(throwInternalServerError);

    const service = new TranslationService(provider.setHttpClient(new OfetchHttpClient($fetch.create({ baseURL: provider.baseURL }))));

    return service
        .load(locale)
        .catch((cause) => throwBadGatewayError(cause, locale));
}, cacheOptions);

// #region utils
function assertLocale(locale?: string): asserts locale is string {
    if (locale) return;

    const error = new UndefinedLocaleError(locale);

    throw createError(error);
}

function throwBadGatewayError(cause: unknown, locale: string): never {
    const error = new TranslationsUnavailableError(locale);
    error.cause = cause;

    throw createError(error);
}

function throwInternalServerError(cause: unknown): never {
    const error = new UndefinedVendorError();
    error.cause = cause;

    throw createError(error);
}

function getKey(event: H3Event<EventHandlerRequest>) {
    const locale = getRouterParam(event, "locale");
    assertLocale(locale);
    return locale;
}
// #endregion
