/** The four prefixes `.husky/pre-push` accepts; anything else is unpushable. */
export const BRANCH_TYPES = ["feature", "fix", "hotfix", "release"] as const;

export type BranchType = (typeof BRANCH_TYPES)[number];

export const slugify = (title: string): string =>
    title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");

/** The project slug stays one path segment so `.husky/pre-push` accepts real board names. */
export const branchName = (
    type: BranchType,
    project: string,
    issue: number,
    title: string,
): string => `${type}/${slugify(project)}/${issue}-${slugify(title)}`;

export interface BranchIssue {
    board: string;
    number: number;
}

/** The inverse of `branchName`; the board segment is the slug, not the board's title. */
export const issueFromBranch = (branch: string): BranchIssue | undefined => {
    const match = /^[^/]+\/([^/]+)\/(\d+)-/.exec(branch);
    return match?.[1] && match[2] ? { board: match[1], number: Number(match[2]) } : undefined;
};

const LABEL_TYPES: Record<string, BranchType> = { enhancement: "feature", bug: "fix" };

export const isBranchType = (value: string): value is BranchType =>
    (BRANCH_TYPES as readonly string[]).includes(value);

/** Undefined for a `spike` or an unmapped label: which branch that becomes is a judgement call. */
export const branchTypeFor = (labels: string[]): BranchType | undefined => {
    const types = new Set(labels.flatMap((label) => LABEL_TYPES[label] ?? []));
    return types.size === 1 ? [...types][0] : undefined;
};
