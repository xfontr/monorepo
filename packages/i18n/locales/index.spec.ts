import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "vitest";

const locales = readdirSync(join(__dirname)).filter((locale) =>
    locale.includes(".json"),
);

describe("locales", () => {
    it.each(locales)("", () => {});
});
