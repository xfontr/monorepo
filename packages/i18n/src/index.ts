export type { HttpClient } from "./core/ports/HttpClient";
export { default as TranslationProvider } from "./core/ports/TranslationProvider";
export type { Locale, TranslationMap } from "./core/domain/translations";
export type { Vendor } from "./core/domain/Vendor";
export { OfetchHttpClient } from "./core/adapters/clients/OfetchHttpClient";
export { default as createProvider, type VendorConfig, type VendorName } from "./core/registry";
export { translationsKey } from "./core/translationsKey";
export * from "./core/domain/errors";
