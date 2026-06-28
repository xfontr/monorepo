import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as localePaths from ".";

const MIN_LOCALES = 1;

const locales = readdirSync(join(__dirname))
    .filter((locale) => locale.includes(".json"))
    .map((locale) => locale.split(".")[0] as keyof typeof localePaths);

describe("locales", () => {
    it("there should be at least one locale", () => {
        expect(locales.length).toBeGreaterThanOrEqual(MIN_LOCALES);
    });

    it.each(locales)("there should be an export path for %s", (locale) => {
        const expectedPath = join(__dirname, `${locale}.json`);
        const exported = localePaths[locale];

        expect(exported).toBe(expectedPath);
    });
});
