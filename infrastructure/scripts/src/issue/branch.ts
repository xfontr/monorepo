/** The four prefixes `.husky/pre-push` accepts; anything else is unpushable. */
export const BRANCH_TYPES = ["feature", "fix", "hotfix", "release"] as const;

export type BranchType = typeof BRANCH_TYPES[number];

/**
 * Whatever you typed, made safe for a ref name: lower-case, accents stripped, everything else
 * collapsed into single dashes. `git check-ref-format` rejects far less than this, but a branch
 * name is read by people more often than by git.
 */
export const slugify = (title: string): string =>
    title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

export const branchName = (type: BranchType, issue: number, title: string): string =>
    `${type}/${issue}-${slugify(title)}`;
