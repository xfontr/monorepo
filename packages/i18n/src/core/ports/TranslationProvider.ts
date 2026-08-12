import type { Locale, TranslationMap } from "../domain/translations";
import type { Vendor } from "../domain/Vendor";
import type { HttpClient } from "./HttpClient";

abstract class TranslationProvider<T extends object = object> implements Vendor<T> {
    baseURL: string;
    project: string;
    options: T;

    constructor({ baseURL, project, options }: Vendor<T>, protected readonly http: HttpClient) {
        this.baseURL = baseURL;
        this.project = project;
        this.options = options;
    }

    public abstract getTranslations(locale: Locale): Promise<TranslationMap>;
}

export default TranslationProvider;
