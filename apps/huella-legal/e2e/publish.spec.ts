import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@monorepo/configs/playwright/test";

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const PATH = "/publicar/";

test("the publish page answers 200 with its heading inside the shell", async ({ page }) => {
    const response = await page.goto(PATH);

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Tu artículo, leído con la atención que merece.",
    );
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page).toHaveTitle("Publicar");
});

test("the call to action opens a message to the editors with the subject filled in", async ({
    page,
}) => {
    await page.goto(PATH);

    const href = await page.getByRole("link", { name: "Escribir un correo" }).getAttribute("href");
    const mailto = new URL(href ?? "");

    expect(mailto.protocol).toBe("mailto:");
    expect(mailto.pathname).toBe("colaboraciones@huellalegal.com");
    expect(mailto.searchParams.get("subject")).toBe("Propuesta de publicación");
    expect(mailto.searchParams.get("body")).toContain("Resumen:");
});

test("the footer's thesis link lands on the thesis card", async ({ page }) => {
    await page.goto("/");

    await page
        .getByRole("contentinfo")
        .getByRole("link", { name: "Publicar un TFG o TFM" })
        .click();

    await expect(page).toHaveURL(/\/publicar\/#tesis$/);
    await expect(page.getByRole("heading", { name: "¿Es un TFG o un TFM?" })).toBeInViewport();
});

test("the page fits the viewport without scrolling sideways", async ({ page }) => {
    await page.goto(PATH);

    const overflow = await page
        .locator("html")
        .evaluate((html) => html.scrollWidth - html.clientWidth);

    expect(overflow).toBeLessThanOrEqual(0);
});

test("the publish page has no WCAG AA violations", async ({ page }) => {
    await page.goto(PATH);

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

    expect(violations).toEqual([]);
});

test("records the page at this width for review", async ({ page }, testInfo) => {
    await page.goto(PATH);

    await testInfo.attach(`publicar-${testInfo.project.name}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
    });
});
