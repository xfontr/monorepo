import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { PROJECT_ID, projectSlug, projectYaml, type NewProject } from "./projectFile.ts";

const PROJECT: NewProject = {
    id: "harbour-notes",
    title: "Harbour Notes",
    template: "new-website",
    area: "app:harbour-notes",
    milestone: "Harbour Notes",
    summary: "",
    switches: { search: true, blog: false },
    ticketSize: "lean",
};

describe("projectYaml", () => {
    it("writes a file that reads back as the same project", () => {
        expect(parse(projectYaml(PROJECT))).toEqual(PROJECT);
    });

    it("leaves plain titles, ids and labels unquoted, so the file reads like a hand-written one", () => {
        const text = projectYaml(PROJECT);

        expect(text).toContain("title: Harbour Notes\n");
        expect(text).toContain("area: app:harbour-notes\n");
    });

    it.each([
        ["a YAML 1.1 boolean", "Yes"],
        ["a null", "null"],
        ["a number", "2026"],
        ["a comment marker", "Notes # draft"],
        ["a key separator", "Harbour: Notes"],
        ["a leading quote", "'quoted'"],
        ["a line break", "one\ntwo"],
        ["a trailing space", "Harbour "],
    ])("keeps %s a string instead of letting the reader retype or truncate it", (_, title) => {
        expect(parse(projectYaml({ ...PROJECT, title })).title).toBe(title);
    });

    it("writes an empty switch map rather than a key with no value", () => {
        expect(parse(projectYaml({ ...PROJECT, switches: {} })).switches).toEqual({});
    });
});

describe("projectSlug", () => {
    it.each([
        ["Diseño Web", "diseno-web"],
        ["Pérez & Asociados", "perez-asociados"],
        ["  Harbour Notes! ", "harbour-notes"],
    ])("turns %j into an id the file name can take", (title, id) => {
        expect(projectSlug(title)).toBe(id);
        expect(PROJECT_ID.test(projectSlug(title))).toBe(true);
    });
});
