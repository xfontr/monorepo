import { MisconfiguredVendorError } from "#core/domain/errors";
import type { Locale, TranslationMap } from "#core/domain/translations";
import type { Vendor } from "#core/domain/Vendor";
import type { HttpClient } from "./HttpClient";

abstract class TranslationProvider<T extends object = object> implements Vendor<T> {
    readonly baseURL: string;
    readonly project: string;
    readonly options: T;

    constructor({ baseURL, project, options = {} as T }: Vendor<T>, protected readonly http: HttpClient) {
        this.baseURL = baseURL;
        this.project = project;
        this.options = options;

        this.assertConfigured();
    }

    public abstract getTranslations(locale: Locale): Promise<TranslationMap>;

    protected optionProblems(): string[] {
        return [];
    }

    private assertConfigured(): void {
        const problems = [
            !this.project?.trim() ? "project is empty" : "",
            !URL.canParse(this.baseURL) ? "baseURL is not an absolute URL" : "",
            ...this.optionProblems(),
        ].filter(Boolean);

        if (problems.length) throw new MisconfiguredVendorError(this.constructor.name, problems);
    }
}

export default TranslationProvider;
