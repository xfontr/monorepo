/** The four prefixes `.husky/pre-push` accepts; anything else is unpushable. */
export const BRANCH_TYPES = ["feature", "fix", "hotfix", "release"] as const;

export type BranchType = (typeof BRANCH_TYPES)[number];

export const slugify = (title: string): string =>
    title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-/, "")
        .replace(/-$/, "");

/** What an issue with no `app:`, `package:` or `infra:` label is about: the repo as a whole. */
export const REPO_AREA = "repo";

const AREA_PREFIXES = ["app", "package", "infra"] as const;

/** The folder the first area label names, so `app:huella-legal` becomes `huella-legal`. */
export const areaFor = (labels: string[]): string => {
    for (const prefix of AREA_PREFIXES) {
        const label = labels.find((name) => name.startsWith(`${prefix}:`));
        if (label) return label.slice(prefix.length + 1);
    }
    return REPO_AREA;
};

export const branchName = (type: BranchType, area: string, issue: number, title: string): string =>
    `${type}/${slugify(area)}/${issue}-${slugify(title)}`;

export interface BranchIssue {
    area: string;
    number: number;
}

export const issueFromBranch = (branch: string): BranchIssue | undefined => {
    const match = /^[^/]+\/([^/]+)\/(\d+)-/.exec(branch);
    return match?.[1] && match[2] ? { area: match[1], number: Number(match[2]) } : undefined;
};

const LABEL_TYPES: Record<string, BranchType> = { enhancement: "feature", bug: "fix" };

export const isBranchType = (value: string): value is BranchType =>
    (BRANCH_TYPES as readonly string[]).includes(value);

/** Undefined for a `spike` or an unmapped label: which branch that becomes is a judgement call. */
export const branchTypeFor = (labels: string[]): BranchType | undefined => {
    const types = new Set(labels.flatMap((label) => LABEL_TYPES[label] ?? []));
    return types.size === 1 ? [...types][0] : undefined;
};
