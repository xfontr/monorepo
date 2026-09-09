import { describe, expect, it } from "vitest";
import { PROJECT_ROOTS } from "../../shared/domain/layout.ts";
import { findProject, labelFor, matches, rowFor, toProjects, type Runnable } from "./projects.ts";

const RUNNABLE: Runnable[] = [
    { root: "packages", name: "@monorepo/ui" },
    { root: "infrastructure", name: "@monorepo/translations" },
    { root: "apps", name: "@monorepo/tech-docs" },
    { root: "apps", name: "@monorepo/huella-legal" },
];

const PROJECTS = toProjects(RUNNABLE);

describe("labelFor", () => {
    it.each([
        ["@monorepo/huella-legal", "Huella Legal"],
        ["@monorepo/tech-docs", "Tech Docs"],
        ["@monorepo/translations", "Translations"],
    ])("turns %j into the picker row %j", (name, expected) => {
        expect(labelFor(name)).toBe(expected);
    });

    // Title Case on its own reads "Ui", which is the one label nobody would recognise as the
    // component library.
    it("keeps an acronym upper-case instead of title-casing it", () => {
        expect(labelFor("@monorepo/ui")).toBe("UI");
    });
});

describe("toProjects", () => {
    // This script is what `pnpm dev` runs, and it declares its own `dev` script to be reachable that
    // way — so Nx reports it alongside the real ones and picking it would re-open this picker.
    it("drops the scripts package, so the picker can't offer itself", () => {
        expect(toProjects([{ root: "infrastructure", name: "@monorepo/scripts" }])).toEqual([]);
    });

    it("puts apps first and the component library last, so the list opens on what a newcomer wants", () => {
        expect(PROJECTS.map(({ label }) => label)).toEqual(["Huella Legal", "Tech Docs", "Translations", "UI"]);
    });

    it("orders alphabetically inside a layer, so a graph change can't move rows under someone's fingers", () => {
        const apps = toProjects([
            { root: "apps", name: "@monorepo/tech-docs" },
            { root: "apps", name: "@monorepo/huella-legal" },
        ]);

        expect(apps.map(({ label }) => label)).toEqual(["Huella Legal", "Tech Docs"]);
    });

    // The ranking is its own list rather than PROJECT_ROOTS' order, so nothing stops the two from
    // disagreeing except this: a fourth project root added to the layout would otherwise rank below
    // everything, silently and forever. Alphabetically `Aaa` wins, so only the rank can put it last.
    it.each(PROJECT_ROOTS)("ranks %j above a root the layout doesn't declare", (root) => {
        const [first] = toProjects([
            { root: "nowhere", name: "@monorepo/aaa" },
            { root, name: "@monorepo/zzz" },
        ]);

        expect(first?.name).toBe("@monorepo/zzz");
    });
});

describe("findProject", () => {
    it.each([
        ["@monorepo/huella-legal"],
        ["huella-legal"],
        ["Huella Legal"],
        ["huella legal"],
    ])("matches %j, so the scoped name isn't the only spelling that works", (query) => {
        expect(findProject(PROJECTS, query)?.name).toBe("@monorepo/huella-legal");
    });

    // A half-typed name goes to the picker prefilled with it, which narrows the list without this
    // having to decide which project the person meant.
    it("returns nothing for a partial name rather than guessing which project was meant", () => {
        expect(findProject(PROJECTS, "huella")).toBeUndefined();
    });
});

describe("rowFor", () => {
    // clack renders a hint only for the active row, so a layer left in the hint is invisible on
    // every row someone hasn't arrowed to yet — which is every row that matters while browsing.
    it("carries the layer in the row itself, so the grouping is visible without arrowing to it", () => {
        expect(rowFor({ root: "apps", name: "@monorepo/huella-legal", label: "Huella Legal" }))
            .toBe("Huella Legal · apps");
    });
});

describe("matches", () => {
    const UI = { root: "packages", name: "@monorepo/ui", label: "UI" };

    it.each([["ui"], ["UI"], ["@monorepo/u"]])("narrows the list on %j, the way a partial name is typed", (search) => {
        expect(matches(UI, search)).toBe(true);
    });

    // The other question a long list gets asked: not "which project" but "which of the apps".
    it("narrows on a layer, so typing `packages` lists what lives there", () => {
        expect(matches(UI, "packages")).toBe(true);
    });

    it("excludes a project nothing in its spellings or layer contains, so the search can reach empty", () => {
        expect(matches(UI, "legal")).toBe(false);
    });
});
