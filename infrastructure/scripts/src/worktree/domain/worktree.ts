export interface Worktree {
    path: string;
    branch: string | undefined;
}

/** `git worktree list --porcelain` lists the main checkout first, then every linked one. */
export const parseWorktrees = (porcelain: string): Worktree[] =>
    porcelain
        .split(/\n\s*\n/)
        .map((entry) => ({
            path: /^worktree (.+)$/m.exec(entry)?.[1],
            branch: /^branch refs\/heads\/(.+)$/m.exec(entry)?.[1],
        }))
        .filter((tree): tree is Worktree => tree.path !== undefined);

export const isEnvFile = (path: string): boolean => {
    const name = path.split("/").at(-1) ?? "";
    return !path.includes("node_modules/") && (name === ".env" || name.startsWith(".env."));
};

export const preparedLine = (path: string, copied: string[]): string =>
    `${path}: installed${copied.length > 0 ? `, copied ${copied.join(", ")}` : ", no env files to copy"}`;
