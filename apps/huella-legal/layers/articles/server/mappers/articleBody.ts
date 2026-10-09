import type { Root, RootContent } from "hast";
import rehypeSanitize, { defaultSchema, type Options as Schema } from "rehype-sanitize";
import { unified } from "unified";
import type { ArticleBody } from "../../shared/types/ArticleBody";
import { eachElement, parseFragment, slugify, stringifyNodes, textContent } from "../utils/hast";
import { extractNotes } from "./note";
import { annotateHeadings } from "./tocItem";

const CLASS_MAP: Record<string, string> = {
    contenedor: "hl-note",
    "cita-larga": "hl-quote",
    "cita-corta": "hl-quote-short",
    "texto-importante": "hl-callout",
    "texto-destacado": "hl-highlight",
    "wp-block-table": "wp-block-table",
};

const BIBLIOGRAPHY_HEADING = /^(?:bibliografia|fuentes|referencias)(?:-bibliograficas)?$/;

const SCHEMA: Schema = {
    ...defaultSchema,
    clobber: [],
    strip: ["script", "style"],
    tagNames: [...(defaultSchema.tagNames ?? []), "cite", "figcaption", "figure"],
    attributes: {
        ...withoutClassLists(defaultSchema.attributes ?? {}),
        img: [...(defaultSchema.attributes?.img ?? []), "sizes", "srcSet"],
        "*": [
            ...(defaultSchema.attributes?.["*"] ?? []),
            ["className", ...Object.values(CLASS_MAP)],
        ],
    },
};

const sanitizer = unified().use(rehypeSanitize, SCHEMA);

export const toArticleBody = (html: string): ArticleBody => {
    const tree = sanitize(parseFragment(html));
    // Notes close the post, after the bibliography, so they must leave before it is split off
    const notes = extractNotes(tree);
    const bibliography = splitBibliography(tree);
    const toc = annotateHeadings(tree);

    lazyLoadImages(tree);

    const [lead, rest] = splitLead(tree.children);

    return { lead: stringifyNodes(lead), html: stringifyNodes(rest), toc, notes, bibliography };
};

const sanitize = (tree: Root): Root => {
    eachElement(tree, (element) => {
        const { className } = element.properties;

        if (Array.isArray(className))
            element.properties.className = className.map((name) => CLASS_MAP[String(name)] ?? "");
    });

    return sanitizer.runSync(tree) as Root;
};

const splitBibliography = (tree: Root): string[] => {
    const start = tree.children.findLastIndex(isBibliographyHeading);

    if (start === -1) return [];

    const references = tree.children.slice(start + 1).flatMap((node) => {
        if (node.type !== "element" || !textContent(node)) return [];
        if (node.tagName !== "ul" && node.tagName !== "ol")
            return [stringifyNodes(node.tagName === "p" ? node.children : [node])];

        return node.children.flatMap((item) =>
            item.type === "element" && textContent(item) ? [stringifyNodes(item.children)] : [],
        );
    });

    if (references.length) tree.children = tree.children.slice(0, start);

    return references;
};

const isBibliographyHeading = (node: RootContent): boolean =>
    node.type === "element" &&
    /^h[1-6]$/.test(node.tagName) &&
    BIBLIOGRAPHY_HEADING.test(slugify(textContent(node)));

const lazyLoadImages = (tree: Root): void => {
    eachElement(tree, (element) => {
        if (element.tagName !== "img") return;

        element.properties.loading = "lazy";
        element.properties.decoding = "async";
    });
};

const splitLead = (nodes: RootContent[]): [RootContent[], RootContent[]] => {
    const end = nodes.findIndex((node) => node.type === "element" && node.tagName === "p") + 1;

    return [nodes.slice(0, end), nodes.slice(end)];
};

function withoutClassLists(attributes: NonNullable<Schema["attributes"]>): Schema["attributes"] {
    return Object.fromEntries(
        Object.entries(attributes).map(([tagName, definitions]) => [
            tagName,
            definitions.filter(
                (definition) => !(Array.isArray(definition) && definition[0] === "className"),
            ),
        ]),
    );
}
