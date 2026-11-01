import { fakeAuthor, fakeEntry } from "@monorepo/content/testing";
import { describe, expect, it } from "vitest";
import { toArticle } from "../../server/mappers/article";
import { toCitationMeta } from "./citationMeta";

const JOURNAL = { name: "Huella Legal", issn: "2696-7618" };

const AUTHORS = [fakeAuthor(), fakeAuthor()];

const ARTICLE = toArticle(
    fakeEntry({ slug: "la-culpa", publishedAt: "2024-03-09T23:30:00Z", authors: AUTHORS }),
    { siteUrl: "https://revista.test", journal: JOURNAL },
);

describe("toCitationMeta", () => {
    it("emits one citation_author per author, since Scholar drops the co-authors otherwise", () => {
        const authors = toCitationMeta(ARTICLE, JOURNAL).filter(
            ({ name }) => name === "citation_author",
        );

        expect(authors.map(({ content }) => content)).toEqual(AUTHORS.map(({ name }) => name));
    });

    // 23:30 UTC is already the next day in Madrid, where the byline prints it
    it("dates the article the day its byline shows, in Scholar's slashed format", () => {
        expect(toCitationMeta(ARTICLE, JOURNAL)).toContainEqual({
            name: "citation_publication_date",
            content: "2024/03/10",
        });
    });

    it("omits the date of an undated article rather than inventing one", () => {
        const undated = { ...ARTICLE, publishedAt: undefined };

        expect(toCitationMeta(undated, JOURNAL).map(({ name }) => name)).not.toContain(
            "citation_publication_date",
        );
    });
});
