import { describe, expect, it } from "vitest";
import { eachElement, parseFragment, slugify, stringifyNodes, textContent } from "./hast";

describe("parseFragment", () => {
    // Parsed as a document, a pasted `<meta>` would drag a `<head>` and `<body>` in with it
    it("parses a fragment without wrapping it in a document", () => {
        expect(stringifyNodes(parseFragment("<meta charset=\"utf-8\"><p>Texto</p>").children)).toBe("<meta charset=\"utf-8\"><p>Texto</p>");
    });
});

describe("eachElement", () => {
    it("visits every element in document order, nested ones included", () => {
        const tags: string[] = [];

        eachElement(parseFragment("<p>Uno <em>dos</em></p><ul><li>tres</li></ul>"), ({ tagName }) => tags.push(tagName));

        expect(tags).toEqual(["p", "em", "ul", "li"]);
    });
});

describe("textContent", () => {
    it("decodes entities and collapses whitespace into display text", () => {
        expect(textContent(parseFragment("  El&nbsp;dolo\n y <em>la culpa</em> "))).toBe("El dolo y la culpa");
    });
});

describe("slugify", () => {
    it.each([
        ["Introducción", "introduccion"],
        ["El tipo  objetivo", "el-tipo-objetivo"],
        ["¿Qué es?", "que-es"],
        ["§", ""],
    ])("turns %o into %o", (text, slug) => {
        expect(slugify(text)).toBe(slug);
    });
});
