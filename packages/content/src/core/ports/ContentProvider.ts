import type {
    Entry,
    EntryQuery,
    EntryResource,
    Page,
    Query,
    Term,
    TermResource,
} from "#core/domain/content";
import { MisconfiguredVendorError, NotFoundError } from "#core/domain/errors";
import type { Vendor } from "#core/domain/vendor";
import type { HttpClient } from "./HttpClient";

abstract class ContentProvider<T extends object = object> implements Vendor<T> {
    readonly baseURL: string;
    readonly options: T;

    constructor(
        { baseURL, options = {} as T }: Vendor<T>,
        protected readonly http: HttpClient,
    ) {
        this.baseURL = baseURL;
        this.options = options;

        this.assertConfigured();
    }

    public abstract listEntries(resource: EntryResource, query?: EntryQuery): Promise<Page<Entry>>;

    public abstract listTerms(resource: TermResource, query?: Query): Promise<Page<Term>>;

    public async getEntry(resource: EntryResource, slug: string): Promise<Entry> {
        const { items } = await this.listEntries(resource, { slug, perPage: 1 });

        if (!items[0]) throw new NotFoundError(resource, slug);
        return items[0];
    }

    public async getTerm(resource: TermResource, slug: string): Promise<Term> {
        const { items } = await this.listTerms(resource, { slug, perPage: 1 });

        if (!items[0]) throw new NotFoundError(resource, slug);
        return items[0];
    }

    protected configProblems(): string[] {
        return [];
    }

    private assertConfigured(): void {
        const problems = [
            !URL.canParse(this.baseURL) ? "baseURL is not an absolute URL" : "",
            ...this.configProblems(),
        ].filter(Boolean);

        if (problems.length) throw new MisconfiguredVendorError(this.constructor.name, problems);
    }
}

export default ContentProvider;
