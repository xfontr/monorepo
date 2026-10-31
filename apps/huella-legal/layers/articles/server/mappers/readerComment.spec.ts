import { describe, expect, it } from "vitest";
import type { WordpressComment } from "../adapters/wordpress";
import { toReaderComment } from "./readerComment";

const COMMENT: WordpressComment = {
    id: 12,
    parent: 0,
    author_name: " Lucía Pérez ",
    date_gmt: "2024-05-01T10:00:00",
    content: { rendered: "<p>Muy buen artículo.</p>\n<p>Gracias &amp; enhorabuena.</p>\n" },
};

const rendered = (html: string) => toReaderComment({ ...COMMENT, content: { rendered: html } });

describe("toReaderComment", () => {
    it("keeps each of WordPress's paragraphs apart, with its entities decoded", () => {
        expect(toReaderComment(COMMENT)).toEqual({
            id: "12",
            author: "Lucía Pérez",
            publishedAt: "2024-05-01T10:00:00Z",
            paragraphs: ["Muy buen artículo.", "Gracias & enhorabuena."],
        });
    });

    it("turns a reader's markup into its text, so no tag or link reaches the page", () => {
        expect(
            rendered('<p>Mira <a href="https://spam.test">esto</a><script>alert(1)</script></p>')
                .paragraphs,
        ).toEqual(["Mira esto"]);
    });

    // A comment WordPress left unwrapped would otherwise lose its loose text to the filter
    it("reads text outside any paragraph as one paragraph rather than dropping it", () => {
        expect(rendered("Uno<br>dos").paragraphs).toEqual(["Uno dos"]);
    });

    it("names the author a reply answers only when it is given one", () => {
        expect(toReaderComment(COMMENT, "Ana")).toMatchObject({ replyTo: "Ana" });
        expect(toReaderComment(COMMENT).replyTo).toBeUndefined();
    });
});
