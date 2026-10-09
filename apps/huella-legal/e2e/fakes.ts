import { readFileSync } from "node:fs";
import type { Entry } from "@monorepo/content";
import { faker, fakeAsset, fakeAuthor, fakeEntry, fakeTerm, type WordpressContent } from "@monorepo/content/testing";
import type { Locale, TranslationMap } from "@monorepo/i18n";

const LOCALES = new URL("../../../infrastructure/translations/projects/huella-legal/", import.meta.url);

const CATEGORIES = [fakeTerm(), fakeTerm()];
const AUTHORS = [fakeAuthor({ bio: faker.lorem.sentence() }), fakeAuthor()];

export const LEAD = fakeEntry({ image: fakeAsset(), authors: AUTHORS });

export const HEADING = faker.lorem.words(2);

// WordPress escapes the ampersand, so this one proves the page decodes entities
export const ESCAPED = fakeEntry({
    title: `${faker.lorem.words(3)} &amp; ${faker.lorem.words(2)}`,
    body: { format: "html", value: `<p>${faker.lorem.paragraph()}</p><h2>${HEADING}</h2><p>${faker.lorem.paragraph()}</p>` },
});

export const SECTIONS = [faker.lorem.words(3), faker.lorem.words(2)];

export const REFERENCE = faker.lorem.sentence();

export const ARTICLE = fakeEntry({
    image: fakeAsset(),
    terms: [CATEGORIES[0] ?? fakeTerm(), fakeTerm({ resource: "tags" }), fakeTerm({ resource: "tags" })],
    authors: AUTHORS,
    body: {
        format: "html",
        value: `<p>${faker.lorem.paragraph()}<a href="#_ftn1">[1]</a></p>`
          + `<h2>${SECTIONS[0]}</h2><p>${faker.lorem.paragraph()}</p><p>${faker.lorem.paragraph()}<a href="#_ftn2">[2]</a></p>`
          + `<h2>${SECTIONS[1]}</h2><p>${faker.lorem.paragraph()}</p>`
          + `<h2>Bibliografía</h2><p>${REFERENCE}</p><p>${faker.lorem.sentence()}</p>`
          + `<hr><p><a href="#_ftnref1">[1]</a> ${faker.lorem.sentence()}</p><p><a href="#_ftnref2">[2]</a> ${faker.lorem.sentence()}</p>`,
    },
});

export const POSTS: Entry[] = [
    LEAD,
    ESCAPED,
    ARTICLE,
    ...Array.from({ length: 6 }, (_, index) => fakeEntry({
        image: index % 2 === 0 ? fakeAsset() : undefined,
        terms: [CATEGORIES[index % 2] ?? fakeTerm()],
        authors: [AUTHORS[index % 2] ?? fakeAuthor()],
    })),
];

function locale(code: string): TranslationMap {
    return JSON.parse(readFileSync(new URL(`${code}.json`, LOCALES), "utf8")) as TranslationMap;
}

export const CONTENT: WordpressContent = { posts: POSTS, categories: CATEGORIES };

export const TRANSLATIONS = { "es-ES": locale("es-ES") } as const satisfies Record<Locale, TranslationMap>;
