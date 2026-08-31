import type TranslationProvider from "./ports/TranslationProvider";
import type { HttpClient } from "./ports/HttpClient";
import { UndefinedVendorError } from "./domain/errors";
import type { Vendor } from "./domain/vendor";

const providers = {
    internal: () => import("./adapters/providers/InternalProvider"),
    tolgee: () => import("./adapters/providers/TolgeeProvider"),
};

export type VendorName = keyof typeof providers;

export const VENDOR_NAMES = Object.keys(providers) as VendorName[];

type ProviderOf<N extends VendorName> = InstanceType<Awaited<ReturnType<(typeof providers)[N]>>["default"]>;

type OptionsFieldOf<N extends VendorName> = [keyof ProviderOf<N>["options"]] extends [never]
    ? { options?: never }
    : { options: ProviderOf<N>["options"] };

export type VendorConfig = {
    [N in VendorName]: Omit<Vendor, "options"> & { name: N } & OptionsFieldOf<N>
}[VendorName];

type ProviderConstructor = new (vendor: VendorConfig, http: HttpClient) => TranslationProvider;

export function isVendorName(name: string | undefined): name is VendorName {
    return VENDOR_NAMES.includes(name as VendorName);
}

async function createProvider(vendor: VendorConfig, http: HttpClient): Promise<TranslationProvider> {
    const name = vendor?.name;

    if (!isVendorName(name)) throw new UndefinedVendorError(name, VENDOR_NAMES);

    const module = await providers[name]();

    const Provider = module.default as ProviderConstructor;

    return new Provider(vendor, http);
}

export default createProvider;
