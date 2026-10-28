import { fakeEntry, fakeTerm } from "@monorepo/content/testing";
import { describe, expect, it } from "vitest";
import { toArticleSummary } from "./articleSummary";
import { toHome } from "./home";

const CIVIL = fakeTerm({ name: "Derecho civil" });
const PENAL = fakeTerm({ name: "Derecho penal" });
const THESIS = fakeTerm({ resource: "tags", slug: "trabajos-de-fin-de-grado", name: "TFG" });

const post = (...terms: ReturnType<typeof fakeTerm>[]) => toArticleSummary(fakeEntry({ terms }));

const INDEX = Array.from({ length: 12 }, (_, index) =>
    index % 3 === 0 ? post(PENAL, THESIS) : post(CIVIL),
);

describe("toHome", () => {
    it("never shows a post twice across the lead, the latest and the recent cards", () => {
        const { lead, latest, recent } = toHome(INDEX);

        expect([lead, ...latest, ...recent]).toEqual(INDEX.slice(0, 9));
    });

    // The band is its own archive, so a thesis already in the latest may show there too
    it("fills the thesis band with the newest theses from the whole index", () => {
        const { theses } = toHome(INDEX);

        expect(theses).toEqual([INDEX[0], INDEX[3], INDEX[6]]);
    });

    it("counts the posts in each subject, by name", () => {
        const { subjects } = toHome(INDEX);

        expect(subjects.map(({ value, count }) => [value.name, count])).toEqual([
            ["Derecho civil", 8],
            ["Derecho penal", 4],
        ]);
    });

    it("leaves out a format with no posts, since its link would lead to an empty listing", () => {
        const { formats } = toHome(INDEX);

        expect(formats).toEqual([
            { value: "articulo", count: 8 },
            { value: "tfg-tfm", count: 4 },
        ]);
    });

    it("has no lead and empty bands when nothing is published", () => {
        expect(toHome([])).toEqual({
            lead: undefined,
            latest: [],
            recent: [],
            theses: [],
            subjects: [],
            formats: [],
        });
    });
});
