import { fakeAuthor } from "@monorepo/content/testing";
import { describe, expect, it } from "vitest";
import { bylineAuthors } from "./bylineAuthors";

describe("bylineAuthors", () => {
    it("links each author to their profile by slug", () => {
        const author = fakeAuthor({ slug: "ana-gil" });

        expect(bylineAuthors([author])).toEqual([
            { ...author, to: { name: "author", params: { slug: "ana-gil" } } },
        ]);
    });
});
