import { http, HttpResponse, type HttpHandler } from "msw";
import type { Locale, TranslationMap } from "#core/domain/translations";

/** MSW handlers that serve each locale's messages the way Tolgee's export API would. */
export function tolgeeHandlers(
    baseURL: string,
    translations: Record<Locale, TranslationMap>,
): HttpHandler[] {
    return [
        http.get(`${baseURL}/v2/projects/:project/translations/:locale`, ({ params }) => {
            const locale = String(params.locale);
            const messages = translations[locale];

            if (!messages)
                return HttpResponse.json({ code: "language_not_found" }, { status: 404 });

            // Tolgee nests the map under its locale, which TolgeeProvider unwraps
            return HttpResponse.json({ [locale]: messages });
        }),
    ];
}
