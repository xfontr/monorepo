import { expect, test } from "@monorepo/configs/playwright/test";
import { ARTICLE, SUBJECT, TAG } from "./fakes.ts";

const LIST = "s-maxage=3600, stale-while-revalidate=86400";
const ITEM = "s-maxage=21600, stale-while-revalidate=604800";

// A listing index matched by `/**` alone would be served for six hours instead of one
test.describe("route cache headers", () => {
    for (const [path, expected] of [
        ["/", LIST],
        ["/publicaciones/", LIST],
        ["/publicaciones/?page=1", LIST],
        [`/materias/${SUBJECT.slug}/`, LIST],
        [`/etiquetas/${TAG.slug}/`, LIST],
        [`/${ARTICLE.slug}/`, ITEM],
        [`/api/articles/${ARTICLE.slug}`, LIST],
    ] as const) {
        test(`gives ${path} its own TTL rather than a neighbour's`, async ({ request }) => {
            const response = await request.get(path);

            expect(response.status()).toBe(200);
            expect(response.headers()["cache-control"]).toBe(expected);
        });
    }
});
