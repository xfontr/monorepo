import type ContentProvider from "./ports/ContentProvider";
import type { HttpClient } from "./ports/HttpClient";
import { UndefinedVendorError } from "./domain/errors";

const providers = {
    wordpress: () => import("./adapters/providers/wordpress/WordpressProvider"),
};

export type VendorName = keyof typeof providers;

export const VENDOR_NAMES = Object.keys(providers) as VendorName[];

type ProviderOf<N extends VendorName> = InstanceType<Awaited<ReturnType<(typeof providers)[N]>>["default"]>;

export type VendorConfig = {
    [N in VendorName]: { name: N } & ProviderOf<N>["config"]
}[VendorName];

type ProviderConstructor = new (config: VendorConfig, http: HttpClient) => ContentProvider;

export function isVendorName(name: string | undefined): name is VendorName {
    return VENDOR_NAMES.includes(name as VendorName);
}

async function createProvider(vendor: VendorConfig, http: HttpClient): Promise<ContentProvider> {
    const name = vendor?.name;

    if (!isVendorName(name)) throw new UndefinedVendorError(name, VENDOR_NAMES);

    const module = await providers[name]();

    const Provider = module.default as ProviderConstructor;

    return new Provider(vendor, http);
}

export default createProvider;
