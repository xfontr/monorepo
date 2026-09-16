import { toCollectionPath } from "./wiki.ts";

// A link in these docs points at a file and is correct on GitHub, which reads them first — so it is
// fixed here rather than in the markdown.

/** Produced here, consumed by `ProseA`, which alone knows the forge's URL. */
export const REPO_SCHEME = "repo:";

const ABSOLUTE = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/** The reviews cite evidence as `file.ts:91-94`; it narrows a file, it does not name a different one. */
const LINE_RANGE = /:\d+(?:-\d+)?$/;

function segmentsOf(path: string): string[] {
    return path.split("/").filter((segment) => segment !== "" && segment !== ".");
}

function resolveAgainst(base: string[], path: string): string {
    const out = [...base];

    for (const segment of segmentsOf(path)) {
        if (segment === "..") out.pop();
        else out.push(segment);
    }

    return out.join("/");
}

/** `docs/reviews/TEMPLATE.md` is meant to be copied, so its `<file>` is an instruction, not a target. */
export function isPlaceholder(href: string): boolean {
    return href.includes("<");
}

/**
 * The route for a link, `repo:`-prefixed when its target has no page here, or null for one that is
 * already somebody else's to resolve: an external URL or a bare anchor.
 *
 * `isPage` is asked about every target, not only an extension-less one — a `.md` link may name a
 * file the collection does not have, and routing it anyway is what renders a 200 saying "No such page".
 */
export function resolveDocLink(
    href: string,
    fromPath: string,
    isPage: (repoPath: string) => boolean,
): string | null {
    if (href === "" || ABSOLUTE.test(href) || href.startsWith("#") || isPlaceholder(href)) return null;

    const [target = "", ...fragment] = href.split("#");
    const anchor = fragment.length > 0 ? `#${fragment.join("#")}` : "";
    const path = target.replace(LINE_RANGE, "");

    if (path === "") return null;

    const base = href.startsWith("/") ? [] : segmentsOf(fromPath).slice(0, -1);
    const resolved = resolveAgainst(base, path);

    if (resolved === "") return null;

    if (isPage(resolved)) return `/docs${toCollectionPath(resolved)}${anchor}`;

    return `${REPO_SCHEME}${resolved}`;
}
