import type { Vendor } from "./domain/Vendor";
import type TranslationsProvider from "./ports/TranslationProvider";
import { UndefinedVendorError } from "./errors";

const registry = {
    internal: () => import("./adapters/TranslationsInternalProvider"),
    test: () => import("./adapters/TestProvider"),
};

export type VendorName = keyof typeof registry;

type ProviderOf<N extends VendorName> = InstanceType<Awaited<ReturnType<(typeof registry)[N]>>["default"]>;

type OptionsFieldOf<N extends VendorName> = [keyof ProviderOf<N>["options"]] extends [never]
    ? { options?: never }
    : { options: ProviderOf<N>["options"] };

export type VendorConfig = {
    [N in VendorName]: Omit<Vendor, "options"> & { name: N } & OptionsFieldOf<N>
}[VendorName];

type ProviderConstructor = new (vendor: VendorConfig) => TranslationsProvider;

async function getVendor(vendor: VendorConfig): Promise<TranslationsProvider> {
    const load = registry[vendor?.name];

    if (!load) throw new UndefinedVendorError(vendor?.name, Object.keys(registry));

    const module = await load();

    const Provider = module.default as ProviderConstructor;

    return new Provider(vendor);
}

export default getVendor;
