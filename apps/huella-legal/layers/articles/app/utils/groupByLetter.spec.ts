import { describe, expect, it } from "vitest";
import { groupByLetter } from "./groupByLetter";

const byName = (name: string) => name;

describe("groupByLetter", () => {
    it("files an accented initial under its plain letter, so Á never opens a section of its own", () => {
        expect(groupByLetter(["Abogacía", "Árbitros", "Bienes"], byName)).toEqual([
            ["A", ["Abogacía", "Árbitros"]],
            ["B", ["Bienes"]],
        ]);
    });

    it("upper-cases a lower-case initial", () => {
        expect(groupByLetter(["dolo"], byName)).toEqual([["D", ["dolo"]]]);
    });

    it("keeps the order it was given, within and across letters", () => {
        expect(groupByLetter(["Culpa", "Atenuantes", "Culpa grave"], byName)).toEqual([
            ["C", ["Culpa", "Culpa grave"]],
            ["A", ["Atenuantes"]],
        ]);
    });

    it("is empty for an empty list", () => {
        expect(groupByLetter([], byName)).toEqual([]);
    });
});
