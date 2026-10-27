import { fakeEntry, fakeTerm } from "@monorepo/content/testing";
import { describe, expect, it } from "vitest";
import { toArticleSummary, toCategory } from "./articleSummary";
import { toSubjectIndex } from "./subjectIndex";

const CIVIL = fakeTerm({ name: "Derecho civil", description: "Personas y contratos." });
const PENAL = fakeTerm({ name: "Derecho penal" });
const EMPTY = fakeTerm({ name: "Derecho vacío" });
const ESSAYS = fakeTerm({ slug: "ensayos", name: "Ensayos" });
const THESIS = fakeTerm({ resource: "tags", slug: "trabajos-de-fin-de-grado", name: "TFG" });
const DOLO = fakeTerm({ resource: "tags", name: "Dolo" });
const CULPA = fakeTerm({ resource: "tags", name: "Culpa" });

const post = (...terms: ReturnType<typeof fakeTerm>[]) => toArticleSummary(fakeEntry({ terms }));

const categories = [CIVIL, PENAL, EMPTY, ESSAYS].map(toCategory);

describe("toSubjectIndex", () => {
    it("counts the posts in each subject, by name, and keeps the description", () => {
        const { subjects } = toSubjectIndex(
            [post(PENAL), post(CIVIL), post(PENAL, DOLO)],
            categories,
        );

        expect(subjects.map(({ value, count }) => [value.name, count])).toEqual([
            ["Derecho civil", 1],
            ["Derecho penal", 2],
        ]);
        expect(subjects[0]?.value.description).toBe("Personas y contratos.");
    });

    it("leaves out a subject with no posts, since its card would lead to an empty page", () => {
        const { subjects } = toSubjectIndex([post(CIVIL)], categories);

        expect(subjects.map(({ value }) => value.name)).not.toContain("Derecho vacío");
    });

    it("lists Ensayos as a subject like any other", () => {
        const { subjects } = toSubjectIndex([post(ESSAYS), post(CIVIL)], categories);

        expect(subjects.map(({ value }) => value.name)).toEqual(["Derecho civil", "Ensayos"]);
    });

    it("reports every format, so the thesis band is there even before the first thesis", () => {
        const { formats } = toSubjectIndex([post(CIVIL)], categories);

        expect(formats).toEqual([
            { value: "articulo", count: 1 },
            { value: "comentario", count: 0 },
            { value: "tfg-tfm", count: 0 },
        ]);
    });

    it("lists each tag once with its count, alphabetically, without the thesis marker", () => {
        const { topics } = toSubjectIndex(
            [post(CIVIL, DOLO, THESIS), post(CIVIL, DOLO, CULPA)],
            categories,
        );

        expect(topics.map(({ value, count }) => [value.name, count])).toEqual([
            ["Culpa", 1],
            ["Dolo", 2],
        ]);
    });
});
