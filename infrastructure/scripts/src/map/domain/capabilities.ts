export type Kind = "command" | "hook" | "workflow" | "skill";

export type Capability = {
    kind: Kind
    invocation: string
    source: string
    token: string
};

/** Omit commands already exposed by the root so the map stays focused on project-specific capabilities. */
export const STANDARD_TARGETS = ["lint", "typecheck", "test", "test:dev", "test:coverage", "build"];

export type ProjectScripts = {
    root: string
    name: string
    scripts: string[]
};

export const rootCommands = (scripts: string[]): Capability[] =>
    scripts.map((script) => ({
        kind: "command" as const,
        invocation: `pnpm ${script}`,
        source: "package.json",
        token: script,
    }));

export const projectCommands = (projects: ProjectScripts[], rootScripts: string[]): Capability[] =>
    projects.flatMap(({ root, name, scripts }) =>
        scripts
            .filter((script) => !STANDARD_TARGETS.includes(script) && !rootScripts.includes(script))
            .map((script) => ({
                kind: "command" as const,
                invocation: `pnpm exec nx ${script} ${name}`,
                source: `${root}/package.json`,
                token: script,
            })),
    );

export const hooks = (names: string[]): Capability[] =>
    names.map((name) => ({
        kind: "hook" as const,
        invocation: name,
        source: `.husky/${name}`,
        token: name,
    }));

export const workflows = (files: { file: string, name: string }[]): Capability[] =>
    files.map(({ file, name }) => ({
        kind: "workflow" as const,
        invocation: name,
        source: `.github/workflows/${file}`,
        token: file,
    }));

export const skills = (found: { source: string, name: string }[]): Capability[] =>
    found.map(({ source, name }) => ({
        kind: "skill" as const,
        invocation: `$${name}`,
        source,
        token: name,
    }));

/** Match a token without accepting a longer command such as `test:coverage`. */
export const mentions = (text: string, token: string): boolean => {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`${escaped}(?![\\w:-])`).test(text);
};

const sharedPrefix = (a: string, b: string): number => {
    const left = a.split("/");
    const right = b.split("/");
    let shared = 0;
    while (shared < left.length && shared < right.length && left[shared] === right[shared]) shared++;
    return shared;
};

/** Prefer human-facing docs before proximity so skills do not cite one another as explanations. */
const audience = (path: string): number => {
    const name = path.split("/").pop();
    if (name === "README.md") return 0;
    if (name === "AGENTS.md") return 2;
    if (name === "SKILL.md") return 3;
    return 1;
};

export type Doc = { path: string, text: string };

/** Audience ranks before nearness so skills do not cite another skill instead of their README. */
export const documentedBy = ({ source, token }: Capability, docs: Doc[]): string | undefined =>
    docs
        // Exclude a skill's own SKILL.md or every skill would cite itself.
        .filter((doc) => doc.path !== source && mentions(doc.text, token))
        .sort(
            (a, b) =>
                audience(a.path) - audience(b.path)
                || sharedPrefix(b.path, source) - sharedPrefix(a.path, source)
                || a.path.split("/").length - b.path.split("/").length
                || a.path.localeCompare(b.path),
        )
        .at(0)?.path;
