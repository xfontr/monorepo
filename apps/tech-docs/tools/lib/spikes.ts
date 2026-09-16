import { parse } from "yaml";
import { SPIKE_DECISIONS, SPIKE_STATUSES } from "../../shared/spikes.ts";

export interface SpikeProblem {
    file: string
    message: string
}

const FRONTMATTER = /^---\n([\s\S]*?)\n---/;
const FILENAME = /^\d{4}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;

/**
 * Scalars flattened to strings, because every rule below compares against a string and `issue: 106`
 * parses as a number. Null means the block is there but isn't valid YAML, which is its own problem
 * rather than an empty set of fields — `@nuxt/content` reads these same bytes as YAML to render the
 * page, so the checker has to agree with it about what parses.
 */
export function frontmatterFields(source: string): Record<string, string> | null {
    const block = FRONTMATTER.exec(source)?.[1];

    if (block === undefined) return {};

    try {
        const parsed: unknown = parse(block);

        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;

        return Object.fromEntries(
            Object.entries(parsed)
                .filter(([, value]) => value !== null && typeof value !== "object")
                .map(([key, value]) => [key, String(value)]),
        );
    }
    catch {
        return null;
    }
}

function reportProblems(file: string, source: string, filed: ReadonlySet<string>): string[] {
    const problems: string[] = [];

    if (!FILENAME.test(file)) {
        problems.push("filename doesn't match <NNNN>-<slug>.md");
    }

    const fields = frontmatterFields(source);

    if (fields === null) return [...problems, "frontmatter isn't valid YAML"];

    if (!/^\d+$/.test(fields.issue ?? "")) {
        problems.push("frontmatter is missing a numeric `issue:`");
    }

    if (!(SPIKE_STATUSES as readonly string[]).includes(fields.status ?? "")) {
        problems.push(`\`status: ${fields.status ?? "(missing)"}\` isn't one of ${SPIKE_STATUSES.join(", ")}`);
    }

    if (!(SPIKE_DECISIONS as readonly string[]).includes(fields.decision ?? "")) {
        problems.push(`\`decision: ${fields.decision ?? "(missing)"}\` isn't one of ${SPIKE_DECISIONS.join(", ")}`);
    }

    if (fields.decision === "superseded") {
        if (!fields.supersededBy) {
            problems.push("`decision: superseded` needs a `supersededBy:` file");
        }
        else if (!filed.has(fields.supersededBy)) {
            problems.push(`\`supersededBy: ${fields.supersededBy}\` names a file that isn't a filed spike`);
        }
    }
    else if (fields.supersededBy) {
        problems.push("`supersededBy:` is set but `decision` isn't `superseded`");
    }

    return problems;
}

/**
 * Every rule `docs/spikes/README.md` states about a report's filename and frontmatter. A reused
 * number is a problem here where a reused `issue:` is not: two questions off one issue is normal,
 * two reports answering to the same `NNNN` is the collision consecutive numbering exists to prevent.
 */
export function spikeProblems(reports: { file: string, source: string }[]): SpikeProblem[] {
    const filed = new Set(reports.map((report) => report.file));
    const seen = new Map<string, string>();
    const problems: SpikeProblem[] = [];

    for (const { file, source } of reports) {
        const number = file.slice(0, 4);
        const taken = seen.get(number);

        if (taken) problems.push({ file, message: `number ${number} is already ${taken}` });
        else seen.set(number, file);

        problems.push(...reportProblems(file, source, filed).map((message) => ({ file, message })));
    }

    return problems;
}
