import type { Element, Root } from "hast";
import type { Note } from "../../shared/types/Note";
import { noteAnchor, noteReferenceAnchor } from "../../shared/utils/noteAnchors";
import { eachElement, stringifyNodes } from "../utils/hast";

const NOTE_REFERENCE = /^#_ftn(\d+)$/;
const NOTE_BACKLINK = /^#_ftnref(\d+)$/;

export function extractNotes(tree: Root): Note[] {
    const notes: Note[] = [];

    tree.children = tree.children.filter((node) => {
        if (node.type !== "element" || node.tagName !== "p") return true;

        const [marker] = node.children;
        const id = marker?.type === "element" && marker.tagName === "a" && NOTE_BACKLINK.exec(String(marker.properties.href))?.[1];

        if (id) notes.push({ id, html: stringifyNodes(node.children.slice(1)) });

        return !id;
    });

    if (notes.length) eachElement(tree, toNoteReference);

    return notes;
}

function toNoteReference(element: Element): void {
    const id = element.tagName === "a" && NOTE_REFERENCE.exec(String(element.properties.href))?.[1];

    if (!id) return;

    const link: Element = {
        type: "element",
        tagName: "a",
        properties: { href: `#${noteAnchor(id)}`, id: noteReferenceAnchor(id) },
        children: [{ type: "text", value: id }],
    };

    Object.assign(element, { tagName: "sup", properties: {}, children: [link] });
}
