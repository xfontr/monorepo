import { describe, expect, it } from "vitest";
import { initials } from "./initials";

describe("initials", () => {
    it.each([
        ["María José Fernández", "MJ"],
        ["Ana de la Torre", "AT"],
        ["Álvaro Núñez", "ÁN"],
        ["Luis", "L"],
    ])('skips lower-case particles in %s, so a surname is never a "d"', (name, expected) => {
        expect(initials(name)).toBe(expected);
    });

    it("returns nothing for an all lower-case name, leaving the avatar its own fallback", () => {
        expect(initials("colectivo anónimo")).toBe("");
    });
});
