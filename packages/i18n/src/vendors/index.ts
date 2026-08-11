import type { RuntimeConfig } from "../nuxt/shared";
import type { TranslationProvider } from "../ports/TranslationProvider";
import { OfetchHttpClient } from "../adapters/OfetchHttpClient";

const vendors = {
    server: () => import("../adapters/TranslationsServerProvider"),
};

async function getVendor(config: RuntimeConfig): Promise<TranslationProvider> {
    const { vendor, project, tmsBaseURL } = config.translations;
    const Vendor = await vendors[vendor]().then((module) => module.default);

    return new Vendor(new OfetchHttpClient($fetch.create({ baseURL: tmsBaseURL })), project);
}

export default getVendor;
