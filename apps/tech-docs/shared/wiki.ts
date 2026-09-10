import type { DocKind } from "./types.ts";

/** Nothing below may compare against a capitalised path — `@nuxt/content` lower-cases every path it finds. */

export interface WikiPage {
    path: string
    title?: string
}

export interface WikiEntry {
    /** The collection path, e.g. `/packages/ui/readme`. The route prefixes it with `/docs`. */
    path: string
    label: string
    kind: DocKind
}

export interface WikiGroup {
    key: string
    label: string
    entries: WikiEntry[]
}

export interface WikiSection {
    id: string
    label: string
    icon: string
    /** Why this section exists, shown on the wiki home and nowhere else. */
    blurb: string
    groups: WikiGroup[]
}

/**
 * The reviews *rubric* and history aren't excluded — they're docs about the process, not the dated
 * records. A `TEMPLATE.md`'s placeholder heading (`<Spike title>`) is markup `@nuxt/content` treats
 * as raw HTML and drops from the extracted title, so its nav entry would end up blank.
 */
const EXCLUDED = [/\/changelog$/, /^\/docs\/reviews\/\d{4}-/, /\/template$/];

/** The workspace layout the root README enforces — three project areas, each its own wiki section. */
const PROJECT_AREAS = ["apps", "packages", "infrastructure"] as const;

const SECTION_ORDER = ["workspace", "docs", ...PROJECT_AREAS, "agents"] as const;

type SectionId = typeof SECTION_ORDER[number];

const SECTIONS: Record<SectionId, { label: string, icon: string, blurb: string }> = {
    workspace: {
        label: "Workspace",
        icon: "i-lucide-home",
        blurb: "The two files at the root, and the generated index of everything the repo can do.",
    },
    docs: {
        label: "Docs",
        icon: "i-lucide-library",
        blurb: "Subjects no single project owns — the models, the procedures, the answered spikes.",
    },
    apps: {
        label: "Apps",
        icon: "i-lucide-app-window",
        blurb: "Each app's own reference, colocated with its code so it changes in the same diff.",
    },
    packages: {
        label: "Packages",
        icon: "i-lucide-package",
        blurb: "Each package's own reference, colocated with its code so it changes in the same diff.",
    },
    infrastructure: {
        label: "Infrastructure",
        icon: "i-lucide-server",
        blurb: "Each service's own reference, colocated with its code so it changes in the same diff.",
    },
    agents: {
        label: "Agent setup",
        icon: "i-lucide-bot",
        blurb: "The skills and subagents an agent working in this repo loads.",
    },
};

/** Ordered where the order carries meaning; anything new falls through to alphabetical. */
const DOCS_GROUPS = ["concepts", "guides", "spikes", "reviews"];

/** A folder name is what the workspace calls a project; a reader wants its name, not its slug. */
const NAME_OVERRIDES: Record<string, string> = {
    ui: "UI",
    i18n: "i18n",
};

export function toTitleCase(name: string): string {
    if (NAME_OVERRIDES[name]) return NAME_OVERRIDES[name];

    return name
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

const GROUP_LABELS: Record<string, string> = {
    concepts: "Concepts",
    guides: "Guides",
    spikes: "Spikes",
    reviews: "Reviews",
    skills: "Skills",
    agents: "Subagents",
};

function segmentsOf(path: string): string[] {
    return path.split("/").filter(Boolean);
}

/** Titles here open with an emoji by house style; in a dense nav it is noise twice over. */
export function stripLeadingEmoji(title: string): string {
    return title.replace(/^[^\p{L}\p{N}`@]+/u, "").trim();
}

function kindOf(path: string): DocKind {
    if (path.endsWith("/skill")) return "skill";
    if (path.endsWith("/claude") || path === "/claude") return "claude";
    if (/^\/docs\/spikes\/\d{4}-/.test(path)) return "spike";
    if (path.startsWith("/docs/")) return "doc";

    return "readme";
}

interface Placed {
    section: SectionId
    group: string
    groupLabel: string
    entry: WikiEntry
}

/** Generic labels for README/CLAUDE.md — the group name already says the project; the real title is still the page's own heading. */
function labelWithin(root: string, path: string, title: string): string {
    const raw = segmentsOf(path.slice(root.length));
    // `src` is where the code lives, not a taxonomy a reader navigates by — a nested README's own directory names it.
    const rest = raw[0] === "src" ? raw.slice(1) : raw;
    const file = rest.at(-1) ?? "";
    const directory = rest.slice(0, -1).join("/");

    if (file === "skill") return stripLeadingEmoji(title);
    if (file === "claude") return "Agent notes";
    if (file === "readme") return directory === "" ? "Overview" : directory;

    return stripLeadingEmoji(title);
}

function place(page: WikiPage): Placed {
    const path = page.path;
    const title = page.title ?? path;
    const segments = segmentsOf(path);
    const kind = kindOf(path);

    if (segments[0] === ".claude") {
        const group = segments[1] ?? "skills";

        return {
            section: "agents",
            group,
            groupLabel: GROUP_LABELS[group] ?? group,
            entry: { path, label: stripLeadingEmoji(title), kind },
        };
    }

    if (segments[0] === "docs") {
        const group = segments.length > 2 ? segments[1] ?? "docs" : "docs";
        const root = group === "docs" ? "/docs" : `/docs/${group}`;

        return {
            section: "docs",
            group,
            groupLabel: GROUP_LABELS[group] ?? "The tree itself",
            entry: { path, label: labelWithin(root, path, title), kind },
        };
    }

    if (segments.length === 1) {
        return {
            section: "workspace",
            group: "root",
            groupLabel: "The root",
            entry: { path, label: stripLeadingEmoji(title), kind },
        };
    }

    // Anything left sits under apps/, packages/ or infrastructure/, so its own top segment names
    // the section — the workspace layout is what keeps that assumption safe.
    const area = segments[0] as SectionId;
    const group = segments[1] ?? area;
    const root = `/${segments.slice(0, 2).join("/")}`;

    return {
        section: area,
        group,
        groupLabel: toTitleCase(group),
        entry: { path, label: labelWithin(root, path, title), kind },
    };
}

/** Overview, then the agent notes, then everything else by label — the order you would read them. */
function rankEntry(entry: WikiEntry): number {
    if (entry.label === "Overview") return 0;
    if (entry.label === "Agent notes") return 1;

    return 2;
}

function rankGroup(section: SectionId, key: string): number {
    if (section === "docs") {
        // `docs` itself is the tree's own front matter and sorts above its subdirectories.
        if (key === "docs") return -1;

        const index = DOCS_GROUPS.indexOf(key);

        return index === -1 ? DOCS_GROUPS.length : index;
    }

    return 0;
}

export function buildWiki(pages: WikiPage[]): WikiSection[] {
    const placed = pages
        .filter((page) => !EXCLUDED.some((pattern) => pattern.test(page.path)))
        .map(place);

    return SECTION_ORDER
        .map((id) => {
            const mine = placed.filter((item) => item.section === id);
            const keys = [...new Set(mine.map((item) => item.group))];

            const groups = keys
                .map((key) => ({
                    key,
                    label: mine.find((item) => item.group === key)?.groupLabel ?? key,
                    entries: mine
                        .filter((item) => item.group === key)
                        .map((item) => item.entry)
                        .sort((a, b) => rankEntry(a) - rankEntry(b) || a.label.localeCompare(b.label)),
                }))
                .sort((a, b) => rankGroup(id, a.key) - rankGroup(id, b.key) || a.key.localeCompare(b.key));

            return { id, ...SECTIONS[id], groups };
        })
        .filter((section) => section.groups.length > 0);
}

/** `@nuxt/content` keys a page by a lower-cased, extension-less route; the collector keys it by the real repo path — anything joining the two must cross here first. */
export function toCollectionPath(repoPath: string): string {
    return `/${repoPath.replace(/\.mdx?$/i, "").toLowerCase()}`;
}

/** The section and group a path sits in, for the breadcrumb above a page. */
export function locate(sections: WikiSection[], path: string): { section: WikiSection, group: WikiGroup, entry: WikiEntry } | null {
    for (const section of sections) {
        for (const group of section.groups) {
            const entry = group.entries.find((candidate) => candidate.path === path);

            if (entry) return { section, group, entry };
        }
    }

    return null;
}
