import type { Element, Nodes, Root, RootContent } from "hast";
import rehypeParse from "rehype-parse";
import rehypeSanitize, { defaultSchema, type Options as Schema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import type { ArticleBody } from "../../shared/types/ArticleBody";
import type { Note } from "../../shared/types/Note";
import type { TocItem } from "../../shared/types/TocItem";

const CLASS_MAP: Record<string, string> = {
    "contenedor": "hl-note",
    "cita-larga": "hl-quote",
    "cita-corta": "hl-quote-short",
    "texto-importante": "hl-callout",
    "texto-destacado": "hl-highlight",
    "wp-block-table": "wp-block-table",
};

const BIBLIOGRAPHY_HEADING = /^(?:bibliografia|fuentes|referencias)(?:-bibliograficas)?$/;

const NOTE_REFERENCE = /^#_ftn(\d+)$/;
const NOTE_BACKLINK = /^#_ftnref(\d+)$/;

const SCHEMA: Schema = {
    ...defaultSchema,
    clobber: [],
    strip: ["script", "style"],
    tagNames: [...defaultSchema.tagNames ?? [], "cite", "figcaption", "figure"],
    attributes: {
        ...withoutClassLists(defaultSchema.attributes ?? {}),
        "img": [...defaultSchema.attributes?.img ?? [], "sizes", "srcSet"],
        "*": [...defaultSchema.attributes?.["*"] ?? [], ["className", ...Object.values(CLASS_MAP)]],
    },
};

const parser = unified().use(rehypeParse, { fragment: true });
const sanitizer = unified().use(rehypeSanitize, SCHEMA);
const stringifier = unified().use(rehypeStringify);

export function toArticleBody(html: string): ArticleBody {
    const tree = parser.parse(html);

    eachElement(tree, (element) => {
        const { className } = element.properties;

        if (Array.isArray(className)) element.properties.className = className.map((name) => CLASS_MAP[String(name)] ?? "");
    });

    const clean = sanitizer.runSync(tree) as Root;
    // Notes close the post, after the bibliography, so they must leave before it is split off
    const notes = extractNotes(clean);
    const bibliography = splitBibliography(clean);
    const toc = annotate(clean);

    const split = clean.children.findIndex((node) => node.type === "element" && node.tagName === "p") + 1;

    return { lead: stringify(clean.children.slice(0, split)), html: stringify(clean.children.slice(split)), toc, notes, bibliography };
}

function splitBibliography(tree: Root): string[] {
    const start = tree.children.findLastIndex((node) => isHeading(node) && BIBLIOGRAPHY_HEADING.test(toSlug(textOf(node))));

    if (start === -1) return [];

    const references = tree.children.slice(start + 1).flatMap((node) => {
        if (node.type !== "element" || !textOf(node).trim()) return [];
        if (node.tagName !== "ul" && node.tagName !== "ol") return [stringify(node.tagName === "p" ? node.children : [node])];

        return node.children.flatMap((item) => item.type === "element" && textOf(item).trim() ? [stringify(item.children)] : []);
    });

    if (references.length) tree.children = tree.children.slice(0, start);

    return references;
}

function extractNotes(tree: Root): Note[] {
    const notes: Note[] = [];

    tree.children = tree.children.filter((node) => {
        if (node.type !== "element" || node.tagName !== "p") return true;

        const [marker] = node.children;
        const id = marker?.type === "element" && marker.tagName === "a" && NOTE_BACKLINK.exec(String(marker.properties.href))?.[1];

        if (id) notes.push({ id, html: stringify(node.children.slice(1)) });

        return !id;
    });

    if (!notes.length) return notes;

    eachElement(tree, (element) => {
        const id = element.tagName === "a" && NOTE_REFERENCE.exec(String(element.properties.href))?.[1];

        if (!id) return;

        const link: Element = { type: "element", tagName: "a", properties: { href: `#nota-${id}`, id: `ref-${id}` }, children: [{ type: "text", value: id }] };

        Object.assign(element, { tagName: "sup", properties: {}, children: [link] });
    });

    return notes;
}

function annotate(tree: Root): TocItem[] {
    const toc: TocItem[] = [];
    const used = new Set<string>();

    eachElement(tree, (element) => {
        if (element.tagName === "img") {
            element.properties.loading = "lazy";
            element.properties.decoding = "async";
        }

        if (element.tagName !== "h2" && element.tagName !== "h3") return;

        const label = textOf(element).replace(/\s+/g, " ").trim();

        if (!label) return;

        const { id } = element.properties;
        const base = typeof id === "string" && id ? id : toSlug(label) || "seccion";
        let anchor = base;

        for (let suffix = 2; used.has(anchor); suffix++) anchor = `${base}-${suffix}`;

        used.add(anchor);
        element.properties.id = anchor;
        toc.push({ id: anchor, label, level: element.tagName === "h2" ? 2 : 3 });
    });

    return toc;
}

function eachElement(parent: Root | Element, visit: (element: Element) => void): void {
    for (const node of parent.children) {
        if (node.type !== "element") continue;

        visit(node);
        eachElement(node, visit);
    }
}

function isHeading(node: RootContent): node is Element {
    return node.type === "element" && /^h[1-6]$/.test(node.tagName);
}

function textOf(node: Nodes): string {
    if (node.type === "text") return node.value;

    return "children" in node ? node.children.map(textOf).join("") : "";
}

function toSlug(text: string): string {
    return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function stringify(children: RootContent[]): string {
    return stringifier.stringify({ type: "root", children }).trim();
}

function withoutClassLists(attributes: NonNullable<Schema["attributes"]>): Schema["attributes"] {
    return Object.fromEntries(Object.entries(attributes).map(([tagName, definitions]) => [
        tagName,
        definitions.filter((definition) => !(Array.isArray(definition) && definition[0] === "className")),
    ]));
}
