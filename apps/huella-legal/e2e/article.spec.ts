import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ARTICLE, POSTS, REFERENCE, SECTIONS } from "./fakes.ts";

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// The TOC rail replaces the accordion from Tailwind's `lg` up
const DESKTOP = 1024;

const PATH = `/${ARTICLE.slug}/`;

test("reads the whole article: title, byline, sections, notes, bibliography and citation", async ({ page }) => {
    await page.goto(PATH);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(ARTICLE.title);
    await expect(page.getByRole("link", { name: ARTICLE.authors[0]?.name }).first()).toBeVisible();

    for (const section of SECTIONS) await expect(page.getByRole("heading", { level: 2, name: section })).toBeVisible();

    await expect(page.getByRole("region", { name: "Notas" }).getByRole("listitem")).toHaveCount(2);
    await expect(page.getByRole("region", { name: "Bibliografía" })).toContainText(REFERENCE);
    await expect(page.getByRole("region", { name: "Cómo citar este artículo" })).toContainText(`http://localhost:4310${PATH}`);
});

test("moves the bibliography out of the text, so its heading isn't in the TOC", async ({ page }) => {
    await page.goto(PATH);

    const wide = (page.viewportSize()?.width ?? 0) >= DESKTOP;
    const toc = page.getByRole("navigation", { name: "En este artículo" });

    if (!wide) await toc.getByRole("button", { name: "En este artículo" }).click();

    await expect(toc.getByRole("link")).toHaveText(SECTIONS);
});

test("a note reference and its back-link lead to each other", async ({ page }) => {
    await page.goto(PATH);

    await page.locator("#ref-1").click();
    await expect(page).toHaveURL(/#nota-1$/);

    await page.getByRole("link", { name: "Nota 1, volver al texto" }).click();
    await expect(page).toHaveURL(/#ref-1$/);
});

test("relates the other posts in its category", async ({ page }) => {
    await page.goto(PATH);

    const siblings = POSTS.filter((post) => post !== ARTICLE && post.terms[0]?.id === ARTICLE.terms[0]?.id);
    const related = page.getByRole("region", { name: `También en ${ARTICLE.terms[0]?.name}` });

    await expect(related.locator("ol > li")).toHaveCount(Math.min(3, siblings.length));
});

test("the article page has no WCAG AA violations", async ({ page }) => {
    await page.goto(PATH);

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

    expect(violations).toEqual([]);
});

test("the article page matches its baseline", async ({ page }) => {
    await page.goto(PATH);

    await expect(page).toHaveScreenshot("article.png", { fullPage: true });
});
