import type { Element, Nodes, Root, RootContent } from "hast";
import { toText } from "hast-util-to-text";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

const parser = unified().use(rehypeParse, { fragment: true });
const stringifier = unified().use(rehypeStringify);

export const parseFragment = (html: string): Root => parser.parse(html);

export const stringifyNodes = (nodes: RootContent[]): string =>
    stringifier.stringify({ type: "root", children: nodes }).trim();

export const eachElement = (parent: Root | Element, visit: (element: Element) => void): void => {
    for (const node of parent.children) {
        if (node.type !== "element") continue;

        visit(node);
        eachElement(node, visit);
    }
};

export const textContent = (node: Nodes): string => toText(node).replace(/\s+/g, " ").trim();

export const slugify = (text: string): string =>
    text
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
