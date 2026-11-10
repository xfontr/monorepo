import { describe, expect, it } from "vitest";
import { stripLeadingEmoji, toCollectionPath, toTitleCase } from "./docPages.ts";

describe("stripLeadingEmoji", () => {
    it("keeps a title that opens with a package name, which is not decoration", () => {
        expect(stripLeadingEmoji("@monorepo/ui")).toBe("@monorepo/ui");
    });

    it("strips the emoji the house style opens every heading with", () => {
        expect(stripLeadingEmoji("🧱 Why the boundary system exists")).toBe(
            "Why the boundary system exists",
        );
    });
});

describe("toTitleCase", () => {
    it("title-cases a hyphenated project name", () => {
        expect(toTitleCase("huella-legal")).toBe("Huella Legal");
    });

    it("keeps a single-word name capitalised rather than left as its folder slug", () => {
        expect(toTitleCase("content")).toBe("Content");
    });

    it("overrides a name a hyphen split can't fix, like an acronym or an initialism", () => {
        expect(toTitleCase("ui")).toBe("UI");
        expect(toTitleCase("i18n")).toBe("i18n");
    });
});

describe("toCollectionPath", () => {
    it("lower-cases the collector's path, which is the one thing that silently matches nothing", () => {
        expect(toCollectionPath("packages/ui/README.md")).toBe("/packages/ui/readme");
    });

    it("keeps a path that is already lower-case intact, so a doc under docs/ is not mangled", () => {
        expect(toCollectionPath("docs/guides/first-hour.md")).toBe("/docs/guides/first-hour");
    });
});
