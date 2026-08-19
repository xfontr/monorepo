import type { Entry, EntryQuery, EntryResource, Locale, Page, Query, Term, TermResource } from "#core/domain/content";
import { MisconfiguredVendorError, NotFoundError } from "#core/domain/errors";
import type { HttpClient } from "./HttpClient";

abstract class ContentProvider<T extends object = object> {
    // `config` is public because the registry reads each vendor's config type off it. There is no
    // shared config shape to inherit: what a content vendor needs to be reached differs per vendor.
    constructor(public readonly config: T, protected readonly http: HttpClient) {
        this.assertConfigured();
    }

    public abstract listEntries(resource: EntryResource, query?: EntryQuery): Promise<Page<Entry>>;

    public abstract listTerms(resource: TermResource, query?: Query): Promise<Page<Term>>;

    // Called from this constructor, so an override may only read `config` — a subclass's own field
    // initialisers have not run yet
    protected abstract configProblems(): string[];

    // A slug lookup is a one-item list on every CMS, so a vendor only overrides these if it has a
    // native single-document endpoint
    public async getEntry(resource: EntryResource, slug: string, locale?: Locale): Promise<Entry> {
        const { items } = await this.listEntries(resource, { slug, perPage: 1, locale });

        return items[0] ?? this.throwNotFound(resource, slug);
    }

    public async getTerm(resource: TermResource, slug: string, locale?: Locale): Promise<Term> {
        const { items } = await this.listTerms(resource, { slug, perPage: 1, locale });

        return items[0] ?? this.throwNotFound(resource, slug);
    }

    private throwNotFound(resource: string, slug: string): never {
        throw new NotFoundError(resource, slug);
    }

    private assertConfigured(): void {
        const problems = this.configProblems();

        if (problems.length) throw new MisconfiguredVendorError(this.constructor.name, problems);
    }
}

export default ContentProvider;
