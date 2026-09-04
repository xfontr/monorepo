/**
 * A capability is one thing this repo can do that a newcomer could not have guessed was here: a
 * command, a git hook, a workflow, an agent skill. The map is an index of them, so every field
 * below has to be derivable from a file that already declares it — nothing here is hand-written,
 * because a hand-written column is a second copy of something and gets clobbered on the next
 * render.
 */
export type Kind = "command" | "hook" | "workflow" | "skill";

export type Capability = {
    kind: Kind
    /** What you type, or the filename of the thing that runs itself. */
    invocation: string
    /** Repo-relative path of the file that declares it. */
    source: string
    /** The literal a doc has to contain to count as explaining this capability. */
    token: string
};

/**
 * Every project declares these, and they're documented once in the root README's command table.
 * A row per project would be forty lines of `lint` and `typecheck` burying the eight commands
 * that are actually specific to something.
 */
export const STANDARD_TARGETS = ["lint", "typecheck", "test", "test:dev", "test:coverage", "build"];

export type ProjectScripts = {
    /** Repo-relative directory, e.g. `packages/ui`. */
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

/**
 * A project script is only worth a row when the root doesn't already expose it: `issue:add` lives
 * in this package but you invoke it from the root, and listing both would document one capability
 * twice under two different invocations.
 */
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

/**
 * A project-scoped skill is addressed `content:new-vendor`, which is also the only way to tell two
 * `new-vendor` skills apart — `content` and `i18n` both have one.
 */
export const skills = (found: { source: string, name: string, scope?: string }[]): Capability[] =>
    found.map(({ source, name, scope }) => {
        const addressed = scope ? `${scope}:${name}` : name;
        return { kind: "skill" as const, invocation: `/${addressed}`, source, token: addressed };
    });

/**
 * `release` must not be satisfied by a doc that only mentions `release:dry`, and `test` must not
 * be satisfied by `test:coverage` — so a token can't be followed by a `:` or another word
 * character. It *may* be preceded by one, because the skills table writes package-scoped skills as
 * `content:new-vendor`.
 */
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

/**
 * The map is read by humans, so a README outranks the `CLAUDE.md` or `SKILL.md` that happens to
 * mention the same thing — those are written for an agent and pointing a newcomer at one is a
 * worse answer than pointing them at the README next to the code.
 */
const audience = (path: string): number => {
    const name = path.split("/").pop();
    if (name === "README.md") return 0;
    if (name === "CLAUDE.md") return 2;
    if (name === "SKILL.md") return 3;
    return 1;
};

export type Doc = { path: string, text: string };

/**
 * The best doc that explains a capability, or `undefined` when nothing does.
 *
 * Audience ranks before nearness, and that order is load-bearing: every skill lives under
 * `.claude/skills/`, so nearness-first made each one cite whichever *other* skill happened to
 * mention it — two shared path segments beating the root `CLAUDE.md` table that actually indexes
 * them. Within one audience, nearness is what keeps a `packages/ui` script pointing at
 * `packages/ui/README.md` instead of at the root README.
 */
export const documentedBy = ({ source, token }: Capability, docs: Doc[]): string | undefined =>
    docs
        // A skill's own SKILL.md names the skill, so without this every skill would cite itself as
        // its own explanation and the column would be uniformly green and worthless.
        .filter((doc) => doc.path !== source && mentions(doc.text, token))
        .sort(
            (a, b) =>
                audience(a.path) - audience(b.path)
                || sharedPrefix(b.path, source) - sharedPrefix(a.path, source)
                || a.path.split("/").length - b.path.split("/").length
                || a.path.localeCompare(b.path),
        )
        .at(0)?.path;
