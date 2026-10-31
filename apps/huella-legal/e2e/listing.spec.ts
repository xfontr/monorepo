import AxeBuilder from "@axe-core/playwright";
import { expect, NOT_FOUND_DOCUMENT, test } from "@monorepo/configs/playwright/test";
import type { Page } from "@playwright/test";
import { AUTHOR, POSTS, SIBLING, SOUGHT, SUBJECT, TAG } from "./fakes.ts";

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const LISTINGS = [
    { name: "publications", path: "/publicaciones/", title: "Publicaciones" },
    { name: "subject", path: `/areas/${SUBJECT.slug}/`, title: SUBJECT.name },
    { name: "tag", path: `/etiquetas/${TAG.slug}/`, title: TAG.name },
    { name: "author", path: `/colaboradores/${AUTHOR.slug}/`, title: AUTHOR.name },
];

for (const { name, path, title } of LISTINGS) {
    test(`the ${name} listing renders its own heading and links every post`, async ({ page }) => {
        const response = await page.goto(path);

        expect(response?.status()).toBe(200);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
        const headings = page
            .getByRole("main")
            .getByRole("listitem")
            .getByRole("heading", { level: 3 });

        await expect(headings.first()).toBeVisible();
        await expect(headings.getByRole("link")).toHaveCount(await headings.count());
    });

    test(`the ${name} listing has no WCAG AA violations`, async ({ page }) => {
        await page.goto(path);

        const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

        expect(violations).toEqual([]);
    });
}

test("the archive pages twenty at a time and scrolls back to the top on the next page", async ({
    page,
}) => {
    await page.goto("/publicaciones/");

    const articles = page.getByRole("main").getByRole("article");

    await expect(articles).toHaveCount(20);

    await page.getByRole("link", { name: "Página siguiente" }).click();

    await expect(page).toHaveURL(/\/publicaciones\/\?page=2$/);
    await expect(articles).toHaveCount(POSTS.length - 20);
    await expect
        .poll(() => page.evaluate(() => (globalThis as unknown as { scrollY: number }).scrollY))
        .toBe(0);
});

test("moving from one subject to another swaps the listing, not just the URL", async ({ page }) => {
    await page.goto(`/areas/${SUBJECT.slug}/`);

    await page
        .getByRole("complementary")
        .getByRole("link", { name: new RegExp(`^${SIBLING.name}\\s`) })
        .click();

    await expect(page).toHaveURL(new RegExp(`/areas/${SIBLING.slug}/$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(SIBLING.name);
});

test("the sort lives in the URL, so an oldest-first listing can be shared", async ({ page }) => {
    await page.goto("/publicaciones/");

    const first = await page
        .getByRole("main")
        .getByRole("heading", { level: 3 })
        .first()
        .textContent();

    await page.goto("/publicaciones/?sort=oldest&page=2");

    await expect(page.getByRole("combobox", { name: "Ordenar publicaciones" })).toContainText(
        "Más antiguas",
    );
    await expect(page.getByRole("main").getByRole("heading", { level: 3 }).last()).toHaveText(
        first ?? "",
    );
});

test("a format pill narrows the archive and marks itself current", async ({ page }) => {
    await page.goto("/publicaciones/");

    const pills = page.getByRole("navigation", { name: "Formato" });

    await pills.getByRole("link", { name: /^TFG y TFM/ }).click();

    await expect(page).toHaveURL(/\?format=tfg-tfm$/);
    await expect(pills.getByRole("link", { name: /^TFG y TFM/ })).toHaveAttribute(
        "aria-current",
        "page",
    );
});

test.describe("the archive search", () => {
    const searchbox = (page: Page) => page.getByRole("searchbox", { name: "Buscar en el archivo" });
    const articles = (page: Page) => page.getByRole("main").getByRole("article");

    // The second post that /buscar/ finds has the word only in its body, which this search skips
    test("submitting a query narrows the archive and puts it in the URL", async ({ page }) => {
        await page.goto("/publicaciones/");

        // Hydration empties anything typed before it, so the runner retries
        await expect(async () => {
            await searchbox(page).fill(SOUGHT);
            await searchbox(page).press("Enter");
            await expect(page).toHaveURL(new RegExp(`/publicaciones/\\?query=${SOUGHT}$`), {
                timeout: 1000,
            });
        }).toPass();
        await expect(articles(page)).toHaveCount(1);
        await expect(articles(page).getByRole("heading", { level: 3 })).toContainText(SOUGHT);
    });

    test("an accented, upper-case query finds the same post", async ({ page }) => {
        await page.goto("/publicaciones/?query=CULPABIL%C3%8DDAD");

        await expect(searchbox(page)).toHaveValue("CULPABILÍDAD");
        await expect(articles(page)).toHaveCount(1);
    });

    test("a query nothing matches says so instead of listing nothing", async ({ page }) => {
        await page.goto("/publicaciones/?query=kardashov");

        await expect(
            page.getByRole("heading", { name: "Ningún resultado para «kardashov»" }),
        ).toBeVisible();
        await expect(articles(page)).toHaveCount(0);
    });
});

test.describe("a 404 listing", () => {
    test.use({ allowedConsole: [NOT_FOUND_DOCUMENT] });

    test("a page past the end, or a query the route refuses, is a 404 and never a validation message", async ({
        page,
    }) => {
        for (const path of ["/publicaciones/?page=99", "/publicaciones/?sort=popular"]) {
            const response = await page.goto(path);

            expect(response?.status()).toBe(404);
            await expect(page.getByRole("heading", { level: 1 })).toHaveText(
                "Esta página no existe o ha cambiado de dirección.",
            );
        }
    });

    test("an unknown subject, tag or author is a 404", async ({ page }) => {
        for (const path of [
            "/areas/no-existe/",
            "/etiquetas/no-existe/",
            "/colaboradores/no-existe/",
        ]) {
            expect((await page.goto(path))?.status()).toBe(404);
        }
    });
});
