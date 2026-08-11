export type { HttpClient } from "./core/ports/HttpClient";
export { default as TranslationProvider } from "./core/ports/TranslationProvider";
export type { Locale, TranslationMap } from "./core/domain/translations";
export type { Vendor } from "./core/domain/Vendor";
export { TranslationService } from "./core/domain/TranslationService";
export { OfetchHttpClient } from "./core/adapters/OfetchHttpClient";
export { default as getVendor, type VendorConfig, type VendorName } from "./core/registry";
export * from "./core/domain/errors";
