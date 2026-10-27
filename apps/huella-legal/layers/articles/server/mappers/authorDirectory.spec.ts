import { fakeAuthor, fakeEntry } from "@monorepo/content/testing";
import { describe, expect, it } from "vitest";
import { toArticleSummary } from "./articleSummary";
import { toAuthorDirectory } from "./authorDirectory";

const post = (...authors: ReturnType<typeof fakeAuthor>[]) =>
    toArticleSummary(fakeEntry({ authors }));

const ANA = fakeAuthor({ name: "Ana Ruiz" });
const ALVARO = fakeAuthor({ name: "Álvaro Gil" });
const CARLOS = fakeAuthor({ name: "Carlos Sanz" });

describe("toAuthorDirectory", () => {
    it("counts each author's posts, a co-author included", () => {
        const directory = toAuthorDirectory([post(ANA, ALVARO), post(ANA), post(CARLOS)]);

        expect(directory.map(({ value, count }) => [value.id, count])).toEqual([
            [ANA.id, 2],
            [ALVARO.id, 1],
            [CARLOS.id, 1],
        ]);
    });

    it("puts the most published first and breaks a tie by name, accents folded in", () => {
        const directory = toAuthorDirectory([post(ANA), post(ALVARO), post(CARLOS), post(CARLOS)]);

        expect(directory.map(({ value }) => value.name)).toEqual([
            "Carlos Sanz",
            "Álvaro Gil",
            "Ana Ruiz",
        ]);
    });

    it("is empty for an empty index", () => {
        expect(toAuthorDirectory([])).toEqual([]);
    });
});
