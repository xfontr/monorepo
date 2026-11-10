import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { InvariantFinding } from "#layers/snapshot/shared/types.ts";
import { auditProblems } from "./audits.ts";
import { decisionProblems } from "./decisions.ts";
import { WORKSPACE_ROOT } from "./paths.ts";
import { workflowProblems } from "./workflows.ts";

const BOUNDARIES_PATH = "packages/configs/src/eslint/lib/boundaries.ts";
const README_PATH = "README.md";
const AUDITS_DIR = "docs/audits";
const DECISIONS_DIR = "docs/decisions";
const WORKFLOWS_DIR = "docs/workflows";

/**
 * Duplicated from `.claude/hooks/check-invariants.sh` rather than shelled out to it: that hook reads
 * a Claude tool payload on stdin, not usable as a CLI — and only a pure function can be pinned by a
 * spec.
 */

/** Every `sourceTag:` in the enforced copy of the tag table. */
export const tagsInBoundaries = (source: string): string[] =>
    [...source.matchAll(/sourceTag:\s*"([^"]+)"/g)].map((match) => match[1] ?? "");

/** Every tag named in the leftmost column of the README's tag table. */
export const tagsInReadmeTable = (readme: string): string[] =>
    readme
        .split("\n")
        .map((line) => /^\| `((?:type|scope):[^`]+)`/.exec(line)?.[1] ?? "")
        .filter(Boolean);

/** Project directories listed in the README's workspace-layout code block. */
export const projectsInLayoutBlock = (readme: string): string[] => {
    const block = /## 🗂 Workspace layout\s*```([\s\S]*?)```/.exec(readme)?.[1] ?? "";

    return [...block.matchAll(/^\s{4}([\w-]+)\//gm)].map((match) => match[1] ?? "");
};

export const compareTagTables = (boundaries: string, readme: string): InvariantFinding[] => {
    const enforced = tagsInBoundaries(boundaries);
    const documented = tagsInReadmeTable(readme);

    const undocumented = enforced.filter((tag) => !documented.includes(tag));
    const unenforced = documented.filter((tag) => !enforced.includes(tag));

    const findings: InvariantFinding[] = [];

    if (undocumented.length > 0) {
        findings.push({
            id: "tag-table-undocumented",
            title: "A tag is enforced but not documented",
            detail: `${undocumented.join(", ")} appears in boundaries.ts with no row in the README tag table.`,
            evidence: [BOUNDARIES_PATH, README_PATH],
        });
    }

    if (unenforced.length > 0) {
        findings.push({
            id: "tag-table-unenforced",
            title: "A tag is documented but not enforced",
            detail: `${unenforced.join(", ")} has a README row but no depConstraints entry.`,
            evidence: [README_PATH, BOUNDARIES_PATH],
        });
    }

    return findings;
};

export const compareLayoutBlock = (readme: string, projectRoots: string[]): InvariantFinding[] => {
    const listed = projectsInLayoutBlock(readme);
    const missing = projectRoots
        .map((root) => root.split("/").at(-1) ?? "")
        .filter((directory) => directory && !listed.includes(directory));

    if (missing.length === 0) return [];

    return [
        {
            id: "layout-block-incomplete",
            title: "A project is missing from the workspace layout",
            detail: `${missing.join(", ")} exists in the workspace but is not in the README layout block.`,
            evidence: [README_PATH],
        },
    ];
};

/** Dated audits only — `README.md` and `TEMPLATE.md` are the furniture around them. */
export const listAuditFiles = async (): Promise<string[]> => {
    const entries = await readdir(resolve(WORKSPACE_ROOT, AUDITS_DIR)).catch(() => [] as string[]);

    return entries
        .filter((entry) => /^\d{4}-.+\.md$/.test(entry))
        .sort((a, b) => a.localeCompare(b));
};

/** A finding whose status doesn't parse still counts as open on the audits page, so this is what says why. */
export const compareAuditShape = (audits: { file: string; source: string }[]): InvariantFinding[] =>
    auditProblems(audits).map(({ file, message }) => ({
        id: "audit-shape-mismatch",
        title: "An audit doesn't match the template",
        detail: `${file}: ${message}.`,
        evidence: [`${AUDITS_DIR}/${file}`, `${AUDITS_DIR}/TEMPLATE.md`],
    }));

/** Dated decisions only — `README.md` and `TEMPLATE.md` are the furniture around them. */
export const listDecisionFiles = async (): Promise<string[]> => {
    const entries = await readdir(resolve(WORKSPACE_ROOT, DECISIONS_DIR)).catch(
        () => [] as string[],
    );

    return entries
        .filter((entry) => /^\d{4}-.+\.md$/.test(entry))
        .sort((a, b) => a.localeCompare(b));
};

export const compareDecisionShape = (
    decisions: { file: string; source: string }[],
): InvariantFinding[] =>
    decisionProblems(decisions).map(({ file, message }) => ({
        id: "decision-shape-mismatch",
        title: "A decision report doesn't match the template",
        detail: `${file}: ${message}.`,
        evidence: [`${DECISIONS_DIR}/${file}`, `${DECISIONS_DIR}/README.md`],
    }));

/** The workflows page renders a broken file as a gap, so this is what says which file and why. */
export const compareWorkflowShape = (
    problems: { file: string; message: string }[],
): InvariantFinding[] =>
    problems.map(({ file, message }) => ({
        id: "workflow-shape-mismatch",
        title: "A workflow file breaks the rules",
        detail: `${file}: ${message}.`,
        evidence: [`${WORKFLOWS_DIR}/${file}`, `${WORKFLOWS_DIR}/README.md`],
    }));

export const collectInvariants = async (
    projectRoots: string[] = [],
): Promise<InvariantFinding[]> => {
    const [boundaries, readme, auditFiles, decisionFiles, workflows] = await Promise.all([
        readFile(resolve(WORKSPACE_ROOT, BOUNDARIES_PATH), "utf8"),
        readFile(resolve(WORKSPACE_ROOT, README_PATH), "utf8"),
        listAuditFiles(),
        listDecisionFiles(),
        workflowProblems(resolve(WORKSPACE_ROOT, WORKFLOWS_DIR), WORKSPACE_ROOT),
    ]);

    const audits = await Promise.all(
        auditFiles.map(async (file) => ({
            file,
            source: await readFile(resolve(WORKSPACE_ROOT, AUDITS_DIR, file), "utf8"),
        })),
    );
    const decisions = await Promise.all(
        decisionFiles.map(async (file) => ({
            file,
            source: await readFile(resolve(WORKSPACE_ROOT, DECISIONS_DIR, file), "utf8"),
        })),
    );

    return [
        ...compareTagTables(boundaries, readme),
        ...compareLayoutBlock(readme, projectRoots),
        ...compareAuditShape(audits),
        ...compareDecisionShape(decisions),
        ...compareWorkflowShape(workflows),
    ];
};
