import type { Locale, TranslationMap } from "../domain/translations";
import type { Vendor } from "../domain/Vendor";
import type { HttpClient } from "./HttpClient";

class TranslationsProvider<Name extends string = string, T extends object = object> implements Vendor<Name, T> {
    protected http: HttpClient;

    baseURL: string;
    name: Name;
    project: string;
    options: T;

    constructor({ baseURL, name, project, options }: Vendor<Name, T>) {
        this.baseURL = baseURL;
        this.name = name;
        this.project = project;
        this.options = options;
    }

    public getTranslations(locale: Locale): Promise<TranslationMap> {
        throw new Error("Method not implemented");
    }

    public setHttpClient(http: HttpClient): this {
        this.http = http;
        return this;
    }
}

export default TranslationsProvider;
