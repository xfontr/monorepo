import { existsSync } from "node:fs";
import { relative, resolve } from "node:path";
import { isPlaceholder, resolveDocLink } from "../../shared/docLinks.ts";
import { WORKSPACE_ROOT } from "./paths.ts";

interface MarkdownNode {
    type: string
    url?: string
    children?: MarkdownNode[]
}

/** `@nuxtjs/mdc` hands the parser the collection's file record, whose `path` is absolute. */
interface SourceFile {
    path?: string
}

/**
 * Reference definitions and bare autolinks are not used anywhere in these docs, so an inline `link`
 * is every link there is. Takes the parent, because a placeholder is replaced by its own children.
 */
function eachLink(parent: MarkdownNode, apply: (link: MarkdownNode) => MarkdownNode[] | null): void {
    const children = parent.children ?? [];

    for (let index = children.length - 1; index >= 0; index -= 1) {
        const child = children[index];

        if (!child) continue;

        eachLink(child, apply);

        if (child.type !== "link") continue;

        const replacement = apply(child);

        if (replacement) children.splice(index, 1, ...replacement);
    }
}

/** The `.md` is appended rather than required, because a link may omit it and `checkLink` accepts that. */
function isPage(repoPath: string): boolean {
    const absolute = resolve(WORKSPACE_ROOT, repoPath);

    return /\.mdx?$/i.test(repoPath) ? existsSync(absolute) : existsSync(`${absolute}.md`);
}

/**
 * Remark, not rehype: the mdast-to-hast step strips `.md` from a relative href on its way through,
 * and that extension is the only thing distinguishing a page from a directory. Do not move this later.
 */
export default function remarkDocLinks() {
    return function transform(tree: MarkdownNode, file: SourceFile): void {
        if (!file.path) return;

        const from = relative(WORKSPACE_ROOT, file.path);

        eachLink(tree, (link) => {
            const href = link.url ?? "";

            // A placeholder names no target, so it renders as text rather than as a dead route.
            if (isPlaceholder(href)) return link.children ?? [];

            link.url = resolveDocLink(href, from, isPage) ?? href;

            return null;
        });
    };
}
