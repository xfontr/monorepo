import type TranslationProvider from "./ports/TranslationProvider";
import type { HttpClient } from "./ports/HttpClient";
import { UndefinedVendorError } from "./errors";
import type { Vendor } from "./domain/Vendor";

const providers = {
    internal: () => import("./adapters/providers/InternalProvider"),
    test: () => import("./adapters/providers/TestProvider"),
};

export type VendorName = keyof typeof providers;

type ProviderOf<N extends VendorName> = InstanceType<Awaited<ReturnType<(typeof providers)[N]>>["default"]>;

type OptionsFieldOf<N extends VendorName> = [keyof ProviderOf<N>["options"]] extends [never]
    ? { options?: never }
    : { options: ProviderOf<N>["options"] };

export type VendorConfig = {
    [N in VendorName]: Omit<Vendor, "options"> & { name: N } & OptionsFieldOf<N>
}[VendorName];

type ProviderConstructor = new (vendor: VendorConfig, http: HttpClient) => TranslationProvider;

async function createProvider(vendor: VendorConfig, http: HttpClient): Promise<TranslationProvider> {
    const load = providers[vendor?.name];

    if (!load) throw new UndefinedVendorError(vendor?.name, Object.keys(providers));

    const module = await load();

    const Provider = module.default as ProviderConstructor;

    return new Provider(vendor, http);
}

export default createProvider;
