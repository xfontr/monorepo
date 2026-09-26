/** The vocabulary `docs/audits/README.md` documents, as the one copy every other spelling of it derives from. */
export const FINDING_STATUSES = ["open", "fixed", "wont-fix"] as const;
export const AUDIT_STATES = ["open", "in-progress", "closed"] as const;

export type FindingStatus = typeof FINDING_STATUSES[number];
export type AuditState = typeof AUDIT_STATES[number];

export interface AuditFinding {
    id: string
    /** The `##` heading the finding's table sits under, emoji stripped — `Bugs`, `Duplication`. */
    category: string
    /** Null when the cell's first word isn't in the vocabulary, which `auditProblems` reports. */
    status: FindingStatus | null
    /** Whatever follows the status word — `fixed #152` carries `#152`. */
    ref: string | null
}

const FENCE = /^(?:```|~~~)/;
const HEADING = /^##[^\S\n]+(\S.*)$/;

function cellsOf(line: string): string[] {
    return line.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map((cell) => cell.trim());
}

function isSeparator(line: string): boolean {
    return /^\|?\s*:?-{3,}/.test(line.trim());
}

type FindingColumns = { id: number, status: number };

function findingColumns(cells: string[]): FindingColumns {
    const header = cells.map((cell) => cell.toLowerCase());

    return { id: header.indexOf("id"), status: header.indexOf("status") };
}

function findingOf(cells: string[], columns: FindingColumns, category: string): AuditFinding | null {
    if (columns.id === -1 || columns.status === -1) return null;

    const id = (cells[columns.id] ?? "").replace(/[*`]/g, "").trim();
    if (!id) return null;

    const [word = "", ...rest] = (cells[columns.status] ?? "").split(/\s+/);
    const status = word.toLowerCase();

    return { id, category, status: isFindingStatus(status) ? status : null, ref: rest.join(" ") || null };
}

export function isFindingStatus(value: string): value is FindingStatus {
    return (FINDING_STATUSES as readonly string[]).includes(value);
}

/** Every row of every table whose header has both an `ID` and a `Status` column; any other table is prose. */
export function parseFindings(markdown: string): AuditFinding[] {
    const findings: AuditFinding[] = [];
    let category = "";
    let inFence = false;
    let columns: FindingColumns | null = null;

    for (const line of markdown.split("\n")) {
        if (FENCE.test(line.trim())) {
            inFence = !inFence;
            continue;
        }

        if (inFence) continue;

        const heading = HEADING.exec(line);

        if (heading) {
            category = (heading[1] ?? "").replace(/^[^\p{L}\p{N}]+/u, "").trim();
            columns = null;
            continue;
        }

        if (!line.trim().startsWith("|")) {
            columns = null;
            continue;
        }

        if (isSeparator(line)) continue;

        const cells = cellsOf(line);

        if (columns === null) {
            columns = findingColumns(cells);
            continue;
        }

        const finding = findingOf(cells, columns, category);
        if (finding) findings.push(finding);
    }

    return findings;
}

/** An unparsed status counts as open, so a typo keeps an audit on the list instead of quietly closing it. */
export function auditStateOf(findings: AuditFinding[]): AuditState {
    const open = findings.filter((finding) => finding.status === "open" || finding.status === null).length;

    if (open === 0) return "closed";
    if (open === findings.length) return "open";

    return "in-progress";
}
