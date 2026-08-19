import { hash } from "ohash";
import type { Locale } from "./domain/translations";
import type { VendorConfig } from "./registry";

export function translationsKey(vendor: VendorConfig, locale: Locale): string {
    return [vendor.name, locale, hash([vendor.name, vendor.project, vendor.baseURL, locale])].join(":");
}
