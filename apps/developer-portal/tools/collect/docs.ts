import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { AuditMeta, DecisionOutcome, DecisionStatus, DocKind, DocLink, DocPage, DocsArtifact } from "../../shared/types.ts";
import { parseFindings } from "../../shared/audits.ts";
import { DECISION_OUTCOMES, DECISION_STATUSES } from "../../shared/decisions.ts";
import { frontmatterFields } from "../lib/decisions.ts";
import { WORKSPACE_ROOT } from "../lib/paths.ts";
import { git } from "../lib/run.ts";

// Inline links only. Reference definitions and bare autolinks are not used anywhere in these docs.
const LINK = /\[[^\]]*\]\((?<href>[^)\s]+)(?:\s+"[^"]*")?\)/g;
const HEADING = /^#{1,3}[^\S\n]+\S.*$/gm;

const DECISION_PATH = /^docs\/decisions\/\d{4}-/;
const AUDIT_PATH = /^docs\/audits\/\d{4}-/;

/**
 * Anchors and external links are somebody else's problem; only repo-relative paths are resolvable.
 * A `<placeholder>` in a template is not a link at all — `docs/reviews/TEMPLATE.md` is meant to be
 * copied, so flagging its own instructions would make the count permanently non-zero.
 */
function isRepoRelative(href: string): boolean {
    return !/^(?:[a-z]+:|\/\/|#)/i.test(href) && !href.includes("<");
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
    const path = target?.replace(/:\d+(?:-\d+)?$/, "");

    if (!path) return null;

    const absolute = resolve(dirname(resolve(WORKSPACE_ROOT, fromFile)), decodeURIComponent(path));

    if (await exists(absolute)) return null;

    // A markdown link may omit the extension when a renderer routes it.
    if (await exists(`${absolute}.md`)) return null;

    return { href, resolved: absolute.slice(WORKSPACE_ROOT.length + 1) };
}

function kindOf(path: string): DocKind {
    if (/^docs\/reviews\/\d{4}-/.test(path)) return "review";
    if (DECISION_PATH.test(path)) return "decision";
    if (AUDIT_PATH.test(path)) return "audit";
    if (path.endsWith("CHANGELOG.md")) return "changelog";
    if (path.endsWith("AGENTS.md")) return "agent";
    if (path.endsWith("SKILL.md")) return "skill";
    if (path.startsWith("docs/")) return "doc";

    return "readme";
}

export interface DecisionMeta {
    status: DecisionStatus | null
    decision: DecisionOutcome | null
    supersededBy: string | null
}

const NO_DECISION_META: DecisionMeta = { status: null, decision: null, supersededBy: null };

/**
 * Only a decision report carries this — `TEMPLATE.md` doesn't match `DECISION_PATH` and answers null
 * rather than a stale default. An unrecognised `status`/`decision` value (a typo, a
 * value from before this existed) also answers null instead of guessing, so a missing badge in the
 * dashboard is the visible nudge to fix the frontmatter rather than a silently wrong one.
 */
export function decisionMetaOf(path: string, source: string): DecisionMeta {
    if (!DECISION_PATH.test(path)) return NO_DECISION_META;

    const fields = frontmatterFields(source);

    if (fields === null) return NO_DECISION_META;

    const status = (DECISION_STATUSES as readonly string[]).includes(fields.status ?? "") ? (fields.status as DecisionStatus) : null;
    const decision = (DECISION_OUTCOMES as readonly string[]).includes(fields.decision ?? "") ? (fields.decision as DecisionOutcome) : null;

    return {
        status,
        decision,
        supersededBy: decision === "superseded" ? fields.supersededBy ?? null : null,
    };
}

export function auditMetaOf(path: string, source: string): AuditMeta | null {
    if (!AUDIT_PATH.test(path)) return null;

    const fields = frontmatterFields(source) ?? {};

    return {
        scope: fields.scope ?? null,
        commit: fields.commit ?? null,
        findings: parseFindings(source),
    };
}

export async function collectDocs(_projectRoots: string[], generatedAt: string): Promise<DocsArtifact> {
    const paths = (await git(["ls-files", "--cached", "--others", "--exclude-standard", "--", "*.md"]))
        .split("\n")
        .filter(Boolean);
    const pages: DocPage[] = [];

    for (const path of paths) {
        const absolute = resolve(WORKSPACE_ROOT, path);

        if (!await exists(absolute)) continue;

        const source = await readFile(absolute, "utf8");

        const title = source.match(HEADING)?.[0]?.replace(/^#{1,3}\s+/, "");
        const brokenLinks: DocLink[] = [];

        for (const match of source.matchAll(LINK)) {
            const href = match.groups?.href ?? "";

            if (!isRepoRelative(href)) continue;

            const broken = await checkLink(path, href);

            if (broken) brokenLinks.push(broken);
        }

        const updatedAt = (await git(["log", "-1", "--format=%cI", "--", path])).trim();
        const decisionMeta = decisionMetaOf(path, source);

        pages.push({
            path,
            kind: kindOf(path),
            title: title?.trim() ?? path,
            words: source.split(/\s+/).filter(Boolean).length,
            updatedAt: updatedAt || null,
            decisionStatus: decisionMeta.status,
            decisionOutcome: decisionMeta.decision,
            decisionSupersededBy: decisionMeta.supersededBy,
            audit: auditMetaOf(path, source),
            brokenLinks,
        });
    }

    return {
        generatedAt,
        pages: pages.sort((a, b) => a.path.localeCompare(b.path)),
        brokenLinkCount: pages.reduce((sum, page) => sum + page.brokenLinks.length, 0),
    };
}
