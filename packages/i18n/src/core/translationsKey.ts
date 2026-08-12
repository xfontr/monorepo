import type { Locale } from "./domain/translations";
import type { VendorConfig } from "./registry";

export function translationsKey(vendor: VendorConfig, locale: Locale): string {
    return [
        vendor.name,
        encodeURIComponent(vendor.project),
        encodeURIComponent(vendor.baseURL),
        locale,
    ].filter(Boolean).join(":");
}
