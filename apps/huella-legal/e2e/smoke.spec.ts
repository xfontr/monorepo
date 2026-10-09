import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ESCAPED, HEADING, LEAD, POSTS } from "./fakes.ts";

// Best-practice rules would fail the placeholder entry page on region, landmark-one-main and page-has-heading-one
const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test("serves the entry page with copy from the translations upstream", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("main").getByText("Huella Legal", { exact: true })).toBeVisible();
    await expect(page).toHaveTitle("Huella Legal");
});

test("the entry page has no WCAG AA violations", async ({ page }) => {
    await page.goto("/");

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

    expect(violations).toEqual([]);
});

test("the entry page matches its baseline", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveScreenshot("home.png", { fullPage: true });
});

test("lists articles from the WordPress upstream, one page at a time", async ({ page }) => {
    await page.goto("/publicaciones/");

    await expect(page.getByText(`6 de ${POSTS.length}`)).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: LEAD.title })).toBeVisible();

    await page.goto("/publicaciones/?page=2");

    await expect(page.getByText(`${POSTS.length - 6} de ${POSTS.length}`)).toBeVisible();
    await expect(page.getByText("Página 2 de 2")).toBeVisible();
});

test("opens an article by its slug", async ({ page }) => {
    await page.goto(`/${ESCAPED.slug}/`);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        ESCAPED.title.replace("&amp;", "&"),
    );
    await expect(page.getByRole("heading", { level: 2, name: HEADING })).toBeVisible();
});

test("answers an unknown slug with a real 404", async ({ page }) => {
    const response = await page.goto("/no-existe/");

    expect(response?.status()).toBe(404);
});
