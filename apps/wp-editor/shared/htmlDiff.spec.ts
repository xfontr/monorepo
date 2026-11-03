import { describe, expect, it } from "vitest";
import { htmlDiff } from "./htmlDiff.ts";

const stripHighlights = (html: string) => html.replace(/<\/?(ins|del)>/g, "");

describe("htmlDiff", () => {
    it("wraps only the changed words", () => {
        const { before, after } = htmlDiff("<p>la casa roja</p>", "<p>la casa azul</p>");

        expect(before).toBe("<p>la casa <del>roja</del></p>");
        expect(after).toBe("<p>la casa <ins>azul</ins></p>");
    });

    it("keeps each side's own markup intact when the structure changes", () => {
        const base = "<h2 class='x'>Título</h2><p>uno <b>dos</b></p>";
        const proposed = "<h2>Titulo</h2><ul><li>uno dos</li></ul>";
        const { before, after } = htmlDiff(base, proposed);

        expect(stripHighlights(before)).toBe(base);
        expect(stripHighlights(after)).toBe(proposed);
        // Every highlight holds text only, so removing them leaves no stray opener behind.
        expect(`${before}${after}`.replace(/<(ins|del)>[^<]*<\/\1>/g, "")).not.toMatch(
            /<(ins|del)>/,
        );
    });

    it("never highlights inside a style block", () => {
        const { after } = htmlDiff("<p>a</p>", "<style>p { color: red }</style><p>a</p>");

        expect(after).toBe("<style>p { color: red }</style><p>a</p>");
    });
});
