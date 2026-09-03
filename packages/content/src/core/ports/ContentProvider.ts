import type { Entry, EntryQuery, EntryResource, Page, Query, Term, TermResource } from "#core/domain/content";
import { MisconfiguredVendorError, NotFoundError } from "#core/domain/errors";
import type { HttpClient } from "./HttpClient";

abstract class ContentProvider<T extends object = object> {
    constructor(public readonly config: T, protected readonly http: HttpClient) {
        this.assertConfigured();
    }

    public abstract listEntries(resource: EntryResource, query?: EntryQuery): Promise<Page<Entry>>;

    public abstract listTerms(resource: TermResource, query?: Query): Promise<Page<Term>>;

    protected abstract configProblems(): string[];

    // It's an one-item list on every CMS, override these if CMS has a single-document endpoint
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

    private assertConfigured(): void {
        const problems = this.configProblems();

        if (problems.length) throw new MisconfiguredVendorError(this.constructor.name, problems);
    }
}

export default ContentProvider;
