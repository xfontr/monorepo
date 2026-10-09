import { describe, expect, it, vi } from "vitest";
import { fakeAsset, fakeAuthor, fakeEntry, fakeTerm } from "./factories";

async function freshFactories() {
    vi.resetModules();

    return import("./factories");
}

describe("the domain factories", () => {
    // A screenshot baseline is only as stable as the data behind it
    it("build the same values on every run", async () => {
        const first = (await freshFactories()).fakeEntry();
        const second = (await freshFactories()).fakeEntry();

        expect(second).toEqual(first);
    });

    it("let every override win over what they generate", () => {
        const term = fakeTerm({ resource: "tags", slug: "dogmatica" });

        expect(fakeEntry({ title: "Fijado", terms: [term], authors: [] })).toMatchObject({
            title: "Fijado",
            terms: [term],
            authors: [],
        });
    });

    it("slug invented Spanish names the way WordPress would, with no accents or spaces", () => {
        for (const slug of [fakeAuthor().slug, fakeTerm().slug, fakeEntry().slug]) {
            expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
        }
    });

    it("never point an asset at a real host", () => {
        expect(fakeAsset().url).toMatch(/^data:image\//);
    });
});
