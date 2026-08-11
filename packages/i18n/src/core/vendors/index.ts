import type { RuntimeConfig } from "../../nuxt/shared";
import type { TranslationProvider } from "../ports/TranslationProvider";

const vendors = {
    server: () => import("../adapters/TranslationsServerProvider"),
};

async function getVendor(config: RuntimeConfig): Promise<TranslationProvider> {
    const { vendor, project, tmsBaseURL } = config.translations;
    const Vendor = await vendors[vendor]().then((module) => module.default);

    return new Vendor(project);
}

export default getVendor;
