import { describe, expect, it } from "vitest";
import { parseFragment, stringifyNodes } from "../utils/hast";
import { extractNotes } from "./note";

const TEXT =
    '<p>El dolo<a href="#_ftn1" id="_ftnref1"><u>[1]</u></a> y la culpa<a id="_ftnref2" href="#_ftn2">[2]</a>.</p>';
const NOTES =
    '<p><a href="#_ftnref1" id="_ftn1">[1]</a> ROXIN, <em>Derecho penal</em>.</p><p><a href="#_ftnref2" id="_ftn2">[2]</a>&nbsp;MIR PUIG.</p>';

function extract(html: string) {
    const tree = parseFragment(html);
    const notes = extractNotes(tree);

    return { notes, html: stringifyNodes(tree.children) };
}

describe("extractNotes", () => {
    it("turns `_ftn` references into the links the notes list answers", () => {
        expect(extract(TEXT + NOTES).html).toBe(
            '<p>El dolo<sup><a href="#nota-1" id="ref-1">1</a></sup> y la culpa<sup><a href="#nota-2" id="ref-2">2</a></sup>.</p>',
        );
    });

    it("keeps each note's text without its marker", () => {
        expect(extract(TEXT + NOTES).notes).toEqual([
            { id: "1", html: "ROXIN, <em>Derecho penal</em>." },
            { id: "2", html: "MIR PUIG." },
        ]);
    });

    // Ordinals such as 30.<sup>a</sup> and stray reference numbers are the only <sup>s in the corpus
    it("leaves every other shape as written", () => {
        const source =
            "<p>El dolo<sup>1</sup>, en la 30.<sup>a</sup> edición.</p><p><sup>1</sup> ROXIN.</p>";

        expect(extract(source)).toEqual({ notes: [], html: source });
    });

    // A reference with no note to land on would be a dead link
    it("leaves `_ftn` references alone when the post has no notes to answer them", () => {
        expect(extract(TEXT).html).toBe(TEXT);
    });
});
