import type { TranslationsRuntimeConfig } from "../nuxt/shared";
import type TranslationsProvider from "./ports/TranslationProvider";

const registry = {
    internal: () => import("./adapters/TranslationsInternalProvider"),
    test: () => import("./adapters/TestProvider"),
};

async function getVendor({ vendor }: TranslationsRuntimeConfig): Promise<TranslationsProvider> {
    const Vendor = await registry[vendor.name as keyof typeof registry]().then((module) => module.default);
    return new Vendor(vendor);
}

export default getVendor;
