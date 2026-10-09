import type { Entry } from "@monorepo/content";
import { fakeAuthor, fakeEntry } from "@monorepo/content/testing";
import { describe, expect, it } from "vitest";
import { toArticleSummary } from "./articleSummary";
import { toCitations } from "./citation";

const JOURNAL = { name: "Huella Legal", issn: "0000-0000" };
const PERMALINK = "https://revista.test/la-culpa/";

const article = (overrides: Partial<Entry>) =>
    toArticleSummary(
        fakeEntry({
            title: "La culpa",
            publishedAt: "2024-03-12T10:00:00Z",
            authors: [fakeAuthor({ name: "Ana García López" })],
            ...overrides,
        }),
    );

const cite = (overrides: Partial<Entry> = {}) =>
    Object.fromEntries(
        toCitations(article(overrides), JOURNAL, PERMALINK).map(({ style, text }) => [style, text]),
    );

describe("toCitations", () => {
    it("cites in APA 7 and in the journal's own style", () => {
        expect(cite()).toEqual({
            "APA 7":
                "García López, A. (2024, 12 de marzo). La culpa. Huella Legal. https://revista.test/la-culpa/",
            "Huella Legal":
                "GARCÍA LÓPEZ, A., «La culpa», Huella Legal, 12 de marzo de 2024. ISSN 0000-0000. Disponible en: https://revista.test/la-culpa/",
        });
    });

    // 23:30 UTC on the 11th is already the 12th in Madrid, which is the day the journal published it
    it("dates the citation in the journal's time zone, not the server's", () => {
        expect(cite({ publishedAt: "2024-03-11T23:30:00Z" })["APA 7"]).toContain(
            "(2024, 12 de marzo)",
        );
    });

    it("lists several authors the way each style joins them", () => {
        const citations = cite({
            authors: [
                fakeAuthor({ name: "Ana García" }),
                fakeAuthor({ name: "Bruno Sáez" }),
                fakeAuthor({ name: "Carla Ruiz" }),
            ],
        });

        expect(citations["APA 7"]).toMatch(/^García, A\., Sáez, B\. y Ruiz, C\. \(/);
        expect(citations["Huella Legal"]).toMatch(/^GARCÍA, A\.; SÁEZ, B\.; RUIZ, C\., «/);
    });

    it("marks an undated post s. f. instead of failing on an invalid date", () => {
        const citations = cite({ publishedAt: undefined });

        expect(citations["APA 7"]).toContain("(s. f.)");
        expect(citations["Huella Legal"]).toContain("«La culpa», Huella Legal. ISSN");
    });
});
