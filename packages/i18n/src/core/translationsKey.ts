import { hash } from "ohash";
import type { Locale } from "./domain/translations";
import type { VendorConfig } from "./registry";

// The vendor is hashed whole rather than field by field, so a field added to it cannot be forgotten
// here and let two deployments share an entry. `options` is dropped rather than the rest listed: it
// is where credentials live, credentials are not identity, and a rotated one must not flush the cache.
export function translationsKey(vendor: VendorConfig, locale: Locale): string {
    return [vendor.name, locale, hash({ ...vendor, options: undefined })].map(toWordChars).join("_");
}

// Nitro deletes every non-word character from a custom cache key before storing it, so a readable
// prefix only survives escaped. ohash returns base64url, whose "-" is not a word character, and "_"
// is the separator — both expansions are unambiguous, so distinct parts stay distinct.
function toWordChars(part: string): string {
    return part.replace(/_/g, "_u").replace(/-/g, "_d");
}
