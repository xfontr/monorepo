import { readFileSync } from "node:fs";
import type { Entry, Term, TermResource } from "@monorepo/content";
import {
    faker,
    fakeAsset,
    fakeAuthor,
    fakeEntry,
    fakeTerm,
    type WordpressContent,
} from "@monorepo/content/testing";
import type { Locale, TranslationMap } from "@monorepo/i18n";

const LOCALES = new URL(
    "../../../infrastructure/translations/projects/huella-legal/",
    import.meta.url,
);

export const SUBJECT = fakeTerm({ description: faker.lorem.sentence() });

// The slug the articles layer reads the thesis format from
const THESIS = fakeTerm({
    resource: "tags",
    slug: "trabajos-de-fin-de-grado",
    name: "Trabajos de fin de grado",
});

export const TAG = fakeTerm({ resource: "tags" });

export const SIBLING = fakeTerm();

const CATEGORIES = [SUBJECT, SIBLING, fakeTerm()];
const AUTHORS = [fakeAuthor({ bio: faker.lorem.sentence() }), fakeAuthor()];

export const AUTHOR = AUTHORS[0]!;

export const LEAD = fakeEntry({ image: fakeAsset(), authors: AUTHORS });

export const HEADING = faker.lorem.words(2);

// WordPress escapes the ampersand, so this one proves the page decodes entities
export const ESCAPED = fakeEntry({
    title: `${faker.lorem.words(3)} &amp; ${faker.lorem.words(2)}`,
    body: {
        format: "html",
        value: `<p>${faker.lorem.paragraph()}</p><h2>${HEADING}</h2><p>${faker.lorem.paragraph()}</p>`,
    },
});

export const SECTIONS = [faker.lorem.words(3), faker.lorem.words(2)];

export const REFERENCE = faker.lorem.sentence();

export const ARTICLE = fakeEntry({
    image: fakeAsset(),
    terms: [
        CATEGORIES[0] ?? fakeTerm(),
        fakeTerm({ resource: "tags" }),
        fakeTerm({ resource: "tags" }),
    ],
    authors: AUTHORS,
    body: {
        format: "html",
        value:
            `<p>${faker.lorem.paragraph()}<a href="#_ftn1">[1]</a></p>` +
            `<h2>${SECTIONS[0]}</h2><p>${faker.lorem.paragraph()}</p><p>${faker.lorem.paragraph()}<a href="#_ftn2">[2]</a></p>` +
            `<h2>${SECTIONS[1]}</h2><p>${faker.lorem.paragraph()}</p>` +
            `<h2>Bibliografía</h2><p>${REFERENCE}</p><p>${faker.lorem.sentence()}</p>` +
            `<hr><p><a href="#_ftnref1">[1]</a> ${faker.lorem.sentence()}</p><p><a href="#_ftnref2">[2]</a> ${faker.lorem.sentence()}</p>`,
    },
});

// No seeded lorem produces it, so a search for it finds these two posts and nothing else
export const SOUGHT = "culpabilidad";

const SEARCHED = [
    fakeEntry({ title: `La ${SOUGHT} en el Derecho penal`, terms: [SUBJECT], authors: [AUTHOR] }),
    fakeEntry({
        body: { format: "html", value: `<p>${faker.lorem.paragraph()} ${SOUGHT}.</p>` },
        terms: [SIBLING],
        authors: [AUTHOR],
    }),
];

export const POSTS: Entry[] = [
    LEAD,
    ESCAPED,
    ARTICLE,
    // Past one page of twenty, with every format represented
    ...Array.from({ length: 22 }, (_, index) =>
        fakeEntry({
            image: index % 2 === 0 ? fakeAsset() : undefined,
            terms: [
                CATEGORIES[index % 3] ?? fakeTerm(),
                ...(index % 4 === 0 ? [TAG] : []),
                ...(index % 7 === 0 ? [THESIS] : []),
            ],
            authors: [AUTHORS[index % 2] ?? fakeAuthor()],
        }),
    ),
    // One post each from more authors than the directory's first twelve, so it has more to show
    ...Array.from({ length: 12 }, (_, index) =>
        fakeEntry({
            terms: [SIBLING],
            authors: [fakeAuthor(index % 2 === 0 ? { bio: faker.lorem.sentence() } : {})],
        }),
    ),
    ...SEARCHED,
];

const locale = (code: string): TranslationMap =>
    JSON.parse(readFileSync(new URL(`${code}.json`, LOCALES), "utf8")) as TranslationMap;

// The footer's privacy and cookies links target these headings' ids
export const PRIVACY = "Privacidad";
export const COOKIES = "Cookies";

export const LEGAL = fakeEntry({
    slug: "aviso-legal",
    title: "Aviso legal",
    terms: [],
    authors: [],
    body: {
        format: "html",
        value:
            `<p>${faker.lorem.paragraph()}</p>` +
            `<h2>${PRIVACY}</h2><p>${faker.lorem.paragraph()}</p>` +
            `<h2>${COOKIES}</h2><p>${faker.lorem.paragraph()}</p><p>${faker.lorem.paragraph()}</p>`,
    },
});

export const SOURCE = faker.lorem.sentence();

// Any other page takes the same template, footnotes and closing reference list included
export const PAGE = fakeEntry({
    slug: "nota-editorial",
    terms: [],
    authors: [],
    body: {
        format: "html",
        value:
            `<p>${faker.lorem.paragraph()}<a href="#_ftn1">[1]</a></p>` +
            `<h2>Fuentes</h2><p>${SOURCE}</p>` +
            `<hr><p><a href="#_ftnref1">[1]</a> ${faker.lorem.sentence()}</p>`,
    },
});

// The shell links both, and Nuxt prefetches a linked page's payload, so each has to resolve
const SHELL_PAGES = ["sobre", "contacto"].map((slug) =>
    fakeEntry({ slug, terms: [], authors: [] }),
);

export const PAGES: Entry[] = [LEGAL, PAGE, ...SHELL_PAGES];

// Every term a post links to, since a prefetched payload that 404s logs to the console
const termsOf = (resource: TermResource): Term[] => [
    ...new Map(
        POSTS.flatMap(({ terms }) => terms)
            .filter((term) => term.resource === resource)
            .map((term) => [term.slug, term]),
    ).values(),
];

export const CONTENT: WordpressContent = {
    posts: POSTS,
    pages: PAGES,
    categories: termsOf("categories"),
    tags: termsOf("tags"),
};

export const TRANSLATIONS = { "es-ES": locale("es-ES") } as const satisfies Record<
    Locale,
    TranslationMap
>;
