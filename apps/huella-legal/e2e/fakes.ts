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

export const POSTS: Entry[] = [
    LEAD,
    ESCAPED,
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

export const TRANSLATIONS: Record<Locale, TranslationMap> = { "es-ES": locale("es-ES") };
