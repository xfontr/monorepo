import { hash } from "ohash";
import type { Locale } from "./domain/translations";
import type { VendorConfig } from "./registry";

export const translationsKey = (vendor: VendorConfig, locale: Locale): string =>
    [vendor.name, locale, hash({ ...vendor, options: undefined })].map(toWordChars).join("_");

const toWordChars = (part: string): string => part.replaceAll("_", "_u").replaceAll("-", "_d");
