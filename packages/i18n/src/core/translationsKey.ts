import type { Locale } from "./domain/translations";
import type { VendorConfig } from "./registry";

function serializeOptions(options?: object): string {
    return options ? encodeURIComponent(JSON.stringify(options)) : "";
}

export function translationsKey(vendor: VendorConfig, locale: Locale): string {
    return [
        vendor.name,
        vendor.project,
        encodeURIComponent(vendor.baseURL),
        serializeOptions(vendor.options),
        locale,
    ].filter(Boolean).join(":");
}
