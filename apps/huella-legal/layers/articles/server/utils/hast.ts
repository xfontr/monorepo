import type { Element, Nodes, Root, RootContent } from "hast";
import { toText } from "hast-util-to-text";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

const parser = unified().use(rehypeParse, { fragment: true });
const stringifier = unified().use(rehypeStringify);

export function parseFragment(html: string): Root {
    return parser.parse(html);
}

export function stringifyNodes(nodes: RootContent[]): string {
    return stringifier.stringify({ type: "root", children: nodes }).trim();
}

export function eachElement(parent: Root | Element, visit: (element: Element) => void): void {
    for (const node of parent.children) {
        if (node.type !== "element") continue;

        visit(node);
        eachElement(node, visit);
    }
}

export function textContent(node: Nodes): string {
    return toText(node).replace(/\s+/g, " ").trim();
}

export function slugify(text: string): string {
    return text
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}
