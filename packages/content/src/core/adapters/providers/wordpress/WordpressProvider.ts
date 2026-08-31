import type { Entry, EntryQuery, EntryResource, Page, Query, Term, TermResource } from "#core/domain/content";
import ContentProvider from "#core/ports/ContentProvider";
import { API_PATH } from "./WordpressConfigs";
import { toEntry, toPage, toTerm, toWordpressQuery } from "./WordpressHelpers";
import type { WordpressEntry, WordpressProviderConfig, WordpressTerm } from "./WordpressTypes";

class WordpressProvider extends ContentProvider<WordpressProviderConfig> {
    protected override configProblems(): string[] {
        return URL.canParse(this.config.baseURL) ? [] : ["baseURL is not an absolute URL"];
    }

    override async listEntries(resource: EntryResource, query?: EntryQuery): Promise<Page<Entry>> {
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
        const response = await this.http.get<WordpressTerm[]>(this.url(`${API_PATH}/${resource}`), {
            query: toWordpressQuery(query),
        });

        return toPage(response, query, (term) => toTerm(term, resource));
    }

    // new URL() would discard the path of a subdirectory install, so the site root is joined by hand
    private url(path: string): string {
        return `${this.config.baseURL.replace(/\/+$/, "")}${path}`;
    }
}

export default WordpressProvider;
