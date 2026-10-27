import { describe, expect, it } from "vitest";
import { normalizeText } from "./normalizeText";

describe("normalizeText", () => {
    it.each([
        ["Álvaro Núñez", "alvaro nunez"],
        ["MARÍA", "maria"],
        ["Pérez-Llorca", "perez-llorca"],
    ])("folds %s to %s, so a search typed without accents still matches", (text, expected) => {
        expect(normalizeText(text)).toBe(expected);
    });
});
