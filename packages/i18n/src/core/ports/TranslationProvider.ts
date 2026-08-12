import type { Locale, TranslationMap } from "../domain/translations";
import type { Vendor } from "../domain/Vendor";
import type { HttpClient } from "./HttpClient";

class TranslationProvider<T extends object = object> implements Vendor<T> {
    protected http: HttpClient | undefined;

    baseURL: string;
    project: string;
    options: T;

    constructor({ baseURL, project, options }: Vendor<T>) {
        this.baseURL = baseURL;
        this.project = project;
        this.options = options;
    }

    public getTranslations(locale: Locale): Promise<TranslationMap> {
        throw new Error(`Method not implemented. Could not get translations for ${locale}`);
    }

    public setHttpClient(http: HttpClient): this {
        this.http = http;
        return this;
    }
}

export default TranslationProvider;
