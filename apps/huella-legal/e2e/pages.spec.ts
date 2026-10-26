import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@monorepo/configs/playwright/test";
import type { Page } from "@playwright/test";
import { ARTICLE, COOKIES, LEGAL, PAGE, PRIVACY, SOURCE } from "./fakes.ts";

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const PATH = `/${LEGAL.slug}/`;

// Not the margins, since an article's title sits closer to the kicker a page doesn't have
const TYPE_STYLES = ["font-family", "font-size", "line-height", "max-width", "color"];

const readStyles = (page: Page, selector: string, properties: readonly string[]) =>
    page
        .locator(selector)
        .last()
        .evaluate((element, properties) => {
            const style = element.ownerDocument.defaultView?.getComputedStyle(element);

            return properties.map((property) => style?.getPropertyValue(property) ?? "");
        }, properties);

// The prose's paragraphs are replaced once after hydration, and a detached one reads as unstyled
const proseStyles = async (page: Page) => {
    let styles: string[] = [];

    await expect
        .poll(async () =>
            (styles = await readStyles(page, ".hl-prose p", TYPE_STYLES)).every(Boolean),
        )
        .toBe(true);

    return styles;
};

test("serves the legal notice from WordPress pages, with each policy as a section", async ({
    page,
}) => {
    await page.goto(PATH);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(LEGAL.title);
    await expect(page).toHaveTitle(new RegExp(LEGAL.title));
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");

    for (const section of [PRIVACY, COOKIES])
        await expect(page.getByRole("heading", { level: 2, name: section })).toBeVisible();
});

test("the footer's privacy and cookies links land on their sections", async ({ page }) => {
    await page.goto("/");

    const footer = page.getByRole("contentinfo");

    for (const [name, id] of [
        ["Política de privacidad", "privacidad"],
        ["Política de cookies", "cookies"],
    ] as const) {
        await footer.getByRole("link", { name, exact: true }).click();

        await expect(page).toHaveURL(new RegExp(`${PATH}#${id}$`));
        await expect(page.locator(`#${id}`)).toBeInViewport();

        await page.goto("/");
    }
});

test("renders any other page on the same template, its notes and sources included", async ({
    page,
}) => {
    await page.goto(`/${PAGE.slug}/`);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(PAGE.title);
    await expect(page.getByRole("region", { name: "Notas" }).getByRole("listitem")).toHaveCount(1);
    await expect(page.getByRole("region", { name: "Bibliografía" })).toContainText(SOURCE);
});

// There is no lab design for this template, so the article's prose is the reference
test("sets its text exactly as an article's prose", async ({ page }) => {
    await page.goto(`/${ARTICLE.slug}/`);
    const article = await proseStyles(page);

    await page.goto(PATH);

    expect(await proseStyles(page)).toEqual(article);
});

test("titles the page exactly as an article", async ({ page }) => {
    await page.goto(`/${ARTICLE.slug}/`);
    const article = await readStyles(page, "h1", TYPE_STYLES);

    await page.goto(PATH);

    expect(await readStyles(page, "h1", TYPE_STYLES)).toEqual(article);
});

test("the legal notice has no WCAG AA violations", async ({ page }, testInfo) => {
    await page.goto(PATH);

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

    expect(violations).toEqual([]);

    const path = testInfo.outputPath(`legal-notice-${testInfo.project.name}.png`);

    await page.screenshot({ path, fullPage: true });
    await testInfo.attach(`legal-notice-${testInfo.project.name}`, {
        path,
        contentType: "image/png",
    });
});
