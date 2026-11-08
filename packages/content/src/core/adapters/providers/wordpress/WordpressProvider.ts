import type {
    Entry,
    EntryQuery,
    EntryResource,
    Page,
    Query,
    Term,
    TermResource,
} from "#core/domain/content";
import ContentProvider from "#core/ports/ContentProvider";
import { API_PATH } from "./WordpressConfigs";
import { toEntry, toPage, toTerm, toWordpressQuery } from "./WordpressHelpers";
import type { WordpressEntry, WordpressTerm } from "./WordpressTypes";

class WordpressProvider extends ContentProvider {
    override async listEntries(resource: EntryResource, query?: EntryQuery): Promise<Page<Entry>> {
        const response = await this.http.get<WordpressEntry[]>(`${API_PATH}/${resource}`, {
            query: {
                ...toWordpressQuery(query),
                ...(query?.term ? { [query.term.resource]: query.term.id } : {}),
                author: query?.author,
                _embed: "wp:featuredmedia,wp:term,author",
            },
        });

        return toPage(response, query, toEntry);
    }

    override async listTerms(resource: TermResource, query?: Query): Promise<Page<Term>> {
        const response = await this.http.get<WordpressTerm[]>(`${API_PATH}/${resource}`, {
            query: toWordpressQuery(query),
        });

        return toPage(response, query, (term) => toTerm(term, resource));
    }
}

export default WordpressProvider;
