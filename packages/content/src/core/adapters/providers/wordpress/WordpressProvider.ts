import type { Entry, EntryQuery, EntryResource, Page, Query, Term, TermResource } from "#core/domain/content";
import { UnsupportedQueryError } from "#core/domain/errors";
import ContentProvider from "#core/ports/ContentProvider";
import { API_PATH } from "./WordpressConfigs";
import { toEntry, toPage, toTerm, toWordpressQuery } from "./WordpressHelpers";
import type { WordpressEntry, WordpressProviderConfig, WordpressTerm } from "./WordpressTypes";

class WordpressProvider extends ContentProvider<WordpressProviderConfig> {
    protected override configProblems(): string[] {
        return URL.canParse(this.config.baseURL) ? [] : ["baseURL is not an absolute URL"];
    }

    override async listEntries(resource: EntryResource, query?: EntryQuery): Promise<Page<Entry>> {
        this.assertSupported(query);

        const response = await this.http.get<WordpressEntry[]>(this.url(`${API_PATH}/${resource}`), {
            query: {
                ...toWordpressQuery(query),
                ...(query?.term ? { [query.term.resource]: query.term.id } : {}),
                _embed: "wp:featuredmedia,wp:term",
            },
        });

        return toPage(response, query, toEntry);
    }

    override async listTerms(resource: TermResource, query?: Query): Promise<Page<Term>> {
        this.assertSupported(query);

        const response = await this.http.get<WordpressTerm[]>(this.url(`${API_PATH}/${resource}`), {
            query: toWordpressQuery(query),
        });

        return toPage(response, query, (term) => toTerm(term, resource));
    }

    // new URL() would discard the path of a subdirectory install, so the site root is joined by hand
    private url(path: string): string {
        return `${this.config.baseURL.replace(/\/+$/, "")}${path}`;
    }

    // Core WordPress has no locale axis — Polylang and WPML each add their own `lang` parameter, so
    // a plugin-aware provider maps it here. Refusing beats ignoring: a silently dropped locale is
    // cached under the locale that was asked for and then serves the wrong language.
    private assertSupported(query?: Query): void {
        if (query?.locale) throw new UnsupportedQueryError("WordPress", "locale");
    }
}

export default WordpressProvider;
