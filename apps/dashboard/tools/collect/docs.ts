import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { DocKind, DocLink, DocPage, DocsArtifact } from "../../shared/types.ts";
import { WORKSPACE_ROOT } from "../lib/paths.ts";
import { git } from "../lib/run.ts";

// Inline links only. Reference definitions and bare autolinks are not used anywhere in these docs.
const LINK = /\[(?<text>[^\]]*)\]\((?<href>[^)\s]+)(?:\s+"[^"]*")?\)/g;
const HEADING = /^(#{1,3})\s+(.+)$/gm;

const DEFERRED = /^##\s+🧭\s/m;

/**
 * Anchors and external links are somebody else's problem; only repo-relative paths are resolvable.
 * A `<placeholder>` in a template is not a link at all — `docs/reviews/TEMPLATE.md` is meant to be
 * copied, so flagging its own instructions would make the count permanently non-zero.
 */
function isRepoRelative(href: string): boolean {
    return !/^([a-z]+:|\/\/|#|mailto:)/i.test(href) && !href.includes("<");
}

async function exists(path: string): Promise<boolean> {
    try {
        await access(path);

        return true;
    }
    catch {
        return false;
    }
}

/**
 * Resolves against the filesystem rather than against a route table, because these files are read on
 * GitHub first and in this app second: a link to `./layers` or to `./vite.config.ts` is perfectly
 * valid there, and only a missing target is a real defect.
 */
async function checkLink(fromFile: string, href: string): Promise<DocLink | null> {
    // `#anchor` is one way to point inside a file; `:91-94` is the other, and the reviews cite
    // evidence that way throughout. Neither says anything about whether the file itself exists.
    const [target] = href.split("#");
    const path = target?.replace(/:\d+(-\d+)?$/, "");

    if (!path) return null;

    const absolute = resolve(dirname(resolve(WORKSPACE_ROOT, fromFile)), decodeURIComponent(path));

    if (await exists(absolute)) return null;

    // A markdown link may omit the extension when a renderer routes it.
    if (await exists(`${absolute}.md`)) return null;

    return { href, resolved: absolute.slice(WORKSPACE_ROOT.length + 1) };
}

/**
 * `doc` and `review` are what `docs/` holds — the subjects no single project owns. The rest are
 * colocated with the code they describe, which is why the two are worth telling apart at all.
 */
function kindOf(path: string): DocKind {
    if (/^docs\/reviews\/\d{4}-/.test(path)) return "review";
    if (path.endsWith("CHANGELOG.md")) return "changelog";
    if (path.endsWith("CLAUDE.md")) return "claude";
    if (path.endsWith("SKILL.md")) return "skill";
    if (path.startsWith("docs/")) return "doc";

    return "readme";
}

export async function collectDocs(projectRoots: string[], generatedAt: string): Promise<DocsArtifact> {
    const tracked = (await git(["ls-files", "*.md"])).split("\n").filter(Boolean);
    const pages: DocPage[] = [];

    for (const path of tracked) {
        const source = await readFile(resolve(WORKSPACE_ROOT, path), "utf8");

        const headings = [...source.matchAll(HEADING)].map((match) => (match[2] ?? "").trim());
        const brokenLinks: DocLink[] = [];

        for (const match of source.matchAll(LINK)) {
            const href = match.groups?.href ?? "";

            if (!isRepoRelative(href)) continue;

            const broken = await checkLink(path, href);

            if (broken) brokenLinks.push(broken);
        }

        const updatedAt = (await git(["log", "-1", "--format=%cI", "--", path])).trim();

        pages.push({
            path,
            project: projectRoots.find((root) => path.startsWith(`${root}/`)) ?? null,
            kind: kindOf(path),
            title: headings[0] ?? path,
            headings: headings.slice(1),
            words: source.split(/\s+/).filter(Boolean).length,
            updatedAt: updatedAt || null,
            deferred: DEFERRED.test(source),
            brokenLinks,
        });
    }

    return {
        generatedAt,
        pages: pages.sort((a, b) => a.path.localeCompare(b.path)),
        brokenLinkCount: pages.reduce((sum, page) => sum + page.brokenLinks.length, 0),
    };
}
