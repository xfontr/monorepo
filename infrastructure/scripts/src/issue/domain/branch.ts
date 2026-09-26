/** The four prefixes `.husky/pre-push` accepts; anything else is unpushable. */
export const BRANCH_TYPES = ["feature", "fix", "hotfix", "release"] as const;

export type BranchType = typeof BRANCH_TYPES[number];

export const slugify = (title: string): string =>
    title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");

/** The project slug stays one path segment so `.husky/pre-push` accepts real board names. */
export const branchName = (type: BranchType, project: string, issue: number, title: string): string =>
    `${type}/${slugify(project)}/${issue}-${slugify(title)}`;
