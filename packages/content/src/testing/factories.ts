import { fakerES } from "@faker-js/faker";
import type { Asset, Author, Entry, Term } from "#core/domain/content";

export const faker = fakerES;

faker.seed(192);
faker.setDefaultRefDate("2026-01-01T00:00:00Z");

const PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const id = (): string => String(faker.number.int({ min: 1, max: 99999 }));

const timestamp = (date: Date): string => date.toISOString().replace(/\.\d{3}Z$/, "Z");

export const fakeTerm = (overrides: Partial<Term> = {}): Term => {
    const name = faker.lorem.words({ min: 1, max: 3 });

    return {
        id: id(),
        resource: "categories",
        slug: faker.helpers.slugify(name).toLowerCase(),
        name,
        ...overrides,
    };
};

export const fakeAsset = (overrides: Partial<Asset> = {}): Asset => ({
    id: id(),
    url: PIXEL,
    alt: faker.lorem.sentence(),
    width: 1200,
    height: 630,
    ...overrides,
});

export const fakeAuthor = (overrides: Partial<Author> = {}): Author => {
    const name = faker.person.fullName();

    return { id: id(), slug: faker.helpers.slugify(name).toLowerCase(), name, ...overrides };
};

export const fakeEntry = (overrides: Partial<Entry> = {}): Entry => {
    const title = faker.lorem.sentence({ min: 3, max: 8 }).replace(/\.$/, "");
    const publishedAt = faker.date.past({ years: 2 });

    return {
        id: id(),
        slug: faker.helpers.slugify(title).toLowerCase(),
        title,
        excerpt: { format: "html", value: `<p>${faker.lorem.sentence()}</p>` },
        body: {
            format: "html",
            value: Array.from({ length: 4 }, () => `<p>${faker.lorem.paragraph()}</p>`).join(""),
        },
        publishedAt: timestamp(publishedAt),
        updatedAt: timestamp(faker.date.soon({ days: 30, refDate: publishedAt })),
        terms: [fakeTerm()],
        authors: [fakeAuthor()],
        ...overrides,
    };
};
