import { hash } from "ohash";
import type { Locale } from "./domain/translations";
import type { VendorConfig } from "./registry";

export function translationsKey(vendor: VendorConfig, locale: Locale): string {
    return [vendor.name, locale, hash({ ...vendor, options: undefined })].map(toWordChars).join("_");
}

function toWordChars(part: string): string {
    return part.replace(/_/g, "_u").replace(/-/g, "_d");
}
