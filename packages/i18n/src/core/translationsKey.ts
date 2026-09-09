import { hash } from "ohash";
import type { Locale } from "./domain/translations";
import type { VendorConfig } from "./registry";

// Hashed whole, not field by field, so a field added to the vendor can't be forgotten here and let two
// deployments share an entry. `options` is dropped: it holds credentials, and a rotated one must not bust the cache.
export function translationsKey(vendor: VendorConfig, locale: Locale): string {
    return [vendor.name, locale, hash({ ...vendor, options: undefined })].map(toWordChars).join("_");
}

// Nitro strips every non-word character from a custom cache key, so this escapes what survives: ohash's
// base64url has "-" (not a word char) and "_" (the separator) — both expansions stay unambiguous, no collisions.
function toWordChars(part: string): string {
    return part.replace(/_/g, "_u").replace(/-/g, "_d");
}
