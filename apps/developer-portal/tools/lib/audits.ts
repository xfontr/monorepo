import { FINDING_STATUSES, parseFindings } from "../../shared/audits.ts";
import { frontmatterFields } from "./decisions.ts";

export interface AuditProblem {
    file: string
    message: string
}

const FILENAME = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;

function problemsOf(file: string, source: string): string[] {
    const problems: string[] = [];

    if (!FILENAME.test(file)) problems.push("filename doesn't match <YYYY-MM-DD>-<scope-slug>.md");

    const fields = frontmatterFields(source);

    if (fields === null) return [...problems, "frontmatter isn't valid YAML"];
    if (!fields.scope) problems.push("frontmatter is missing `scope:`");
    if (!/^[0-9a-f]{7,40}$/.test(fields.commit ?? "")) problems.push("frontmatter is missing a short-sha `commit:`");

    const findings = parseFindings(source);

    if (findings.length === 0) problems.push("no table with an `ID` and a `Status` column");

    const seen = new Set<string>();

    for (const finding of findings) {
        if (seen.has(finding.id)) problems.push(`${finding.id} is used twice`);
        seen.add(finding.id);

        if (finding.status === null) problems.push(`${finding.id}'s status isn't one of ${FINDING_STATUSES.join(", ")}`);
    }

    return problems;
}

/** Every rule `docs/audits/README.md` states about an audit's filename, frontmatter and findings tables. */
export function auditProblems(audits: { file: string, source: string }[]): AuditProblem[] {
    return audits.flatMap(({ file, source }) => problemsOf(file, source).map((message) => ({ file, message })));
}
