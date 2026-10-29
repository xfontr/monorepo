import AxeBuilder from "@axe-core/playwright";
import { expect, NOT_FOUND_DOCUMENT, test } from "@monorepo/configs/playwright/test";
import type { Page } from "@playwright/test";
import { MAX_SEARCH_LENGTH } from "@monorepo/content";
import { SOUGHT } from "./fakes.ts";

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const MISSING = "kardashov";

const STATES = [
    { name: "results", path: `/buscar/?query=${SOUGHT}` },
    { name: "no-results", path: `/buscar/?query=${MISSING}` },
    { name: "empty", path: "/buscar/" },
];

test("a search lists every post that matches, under its count and query", async ({ page }) => {
    const response = await page.goto(`/buscar/?query=${SOUGHT}`);

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("searchbox", { name: "Buscar" })).toHaveValue(SOUGHT);
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(
        `2 resultados para «${SOUGHT}»`,
    );
    await expect(page.getByRole("main").getByRole("article")).toHaveCount(2);
});

test("a search with no match says so and offers subjects to browse instead", async ({ page }) => {
    await page.goto(`/buscar/?query=${MISSING}`);

    await expect(
        page.getByRole("heading", { name: `Ningún resultado para «${MISSING}»` }),
    ).toBeVisible();
    await expect(page.getByRole("main").locator("a[href^='/areas/']")).not.toHaveCount(0);
    await expect(page.getByRole("main").getByRole("article")).toHaveCount(0);
});

test("the page with no query invites a search instead of listing anything", async ({ page }) => {
    await page.goto("/buscar/");

    await expect(page.getByRole("searchbox", { name: "Buscar" })).toHaveValue("");
    await expect(page.getByText("Escribe una o varias palabras")).toBeVisible();
    await expect(page.getByRole("main").getByRole("article")).toHaveCount(0);
});

test("submitting the form puts the query in the URL, so a search can be shared", async ({
    page,
}) => {
    await page.goto("/buscar/");

    const searchbox = page.getByRole("searchbox", { name: "Buscar" });

    // Hydration empties anything typed before it, so the runner retries
    await expect(async () => {
        await searchbox.fill(SOUGHT);
        await searchbox.press("Enter");
        await expect(page).toHaveURL(new RegExp(`/buscar/\\?query=${SOUGHT}$`), { timeout: 1000 });
    }).toPass();
    await expect(page.getByRole("main").getByRole("article")).toHaveCount(2);
});

// The e2e tsconfig has no DOM lib
interface Animatable {
    getAnimations: (options: { subtree: boolean }) => { finished: Promise<unknown> }[];
}

const openSearch = async (page: Page) => {
    await page.goto("/");

    const dialog = page.getByRole("dialog", { name: "Buscar en Huella Legal" });

    // Before hydration the button is still a link to /buscar/, so the runner retries
    await expect(async () => {
        await page.getByRole("banner").getByRole("link", { name: "Buscar" }).click();
        await expect(dialog).toBeVisible({ timeout: 1000 });
    }).toPass();

    return dialog;
};

test("the header search opens in place and previews matches while typing", async ({ page }) => {
    const dialog = await openSearch(page);

    await expect(page).toHaveURL(/\/$/);

    await dialog.getByRole("textbox").fill(SOUGHT);

    await expect(
        dialog.getByRole("option", { name: `${SOUGHT} en el Derecho penal` }),
    ).toBeVisible();
});

test("Enter right after typing opens the results page for the whole query", async ({ page }) => {
    const dialog = await openSearch(page);

    await dialog.getByRole("textbox").fill(SOUGHT);
    await dialog.getByRole("textbox").press("Enter");

    await expect(page).toHaveURL(new RegExp(`/buscar/\\?query=${SOUGHT}$`));
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("main").getByRole("article")).toHaveCount(2);
});

test("the open search dialog has no WCAG AA violations", async ({ page }) => {
    await page.goto("/");

    const dialog = page.getByRole("dialog", { name: "Buscar en Huella Legal" });

    await expect(async () => {
        await page.keyboard.press("/");
        await expect(dialog).toBeVisible({ timeout: 1000 });
    }).toPass();
    await dialog.getByRole("textbox").fill(SOUGHT);
    await expect(dialog.getByRole("option").nth(1)).toBeVisible();
    // Mid fade-in, axe measures text against the page showing through the dialog
    await dialog.evaluate((element) =>
        Promise.allSettled(
            (element as unknown as Animatable)
                .getAnimations({ subtree: true })
                .map(({ finished }) => finished),
        ),
    );

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

    expect(violations).toEqual([]);
});

for (const { name, path } of STATES) {
    test(`the ${name} state has no WCAG AA violations`, async ({ page }, testInfo) => {
        await page.goto(path);

        const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

        await testInfo.attach(`buscar-${name}-${testInfo.project.name}`, {
            body: await page.screenshot({ fullPage: true }),
            contentType: "image/png",
        });
        expect(violations).toEqual([]);
    });
}

test.describe("a 404 search", () => {
    test.use({ allowedConsole: [NOT_FOUND_DOCUMENT] });

    test("a page past the end, or a query the route refuses, is a 404", async ({ page }) => {
        for (const path of [
            `/buscar/?query=${SOUGHT}&page=2`,
            `/buscar/?query=${SOUGHT}&page=dos`,
            `/buscar/?query=${"a".repeat(MAX_SEARCH_LENGTH + 1)}`,
        ]) {
            expect((await page.goto(path))?.status()).toBe(404);
        }
    });
});
