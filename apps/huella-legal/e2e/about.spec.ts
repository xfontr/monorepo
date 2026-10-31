import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@monorepo/configs/playwright/test";

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const PATH = "/sobre/";

test("answers at its own route, with its sections reachable by heading", async ({ page }) => {
    await page.goto(PATH);

    await expect(page.getByRole("heading", { level: 1 }).locator("em")).toHaveText("huella");
    await expect(page).toHaveTitle(/Sobre Huella Legal/);

    for (const name of ["Tres principios", "Un proyecto abierto, sin ánimo de lucro"])
        await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
});

// The quote is the one section with no heading, so it alone is a named landmark
test("names the quote's landmark after its visible label", async ({ page }) => {
    await page.goto(PATH);

    await expect(
        page.getByRole("region", { name: "Por qué existimos" }).getByRole("blockquote"),
    ).toBeVisible();
});

// The count-up is drawn by CSS, so the number itself must stay in the text
test("keeps every figure readable as text, whatever the counter animation shows", async ({
    page,
}) => {
    await page.goto(PATH);

    await expect(page.getByRole("main").getByRole("definition")).toHaveText([
        /^[1-9]\d*$/,
        /^[1-9]\d*$/,
    ]);
});

test("the call to action's fingerprint holds its draw until it scrolls into view", async ({
    page,
}) => {
    await page.goto(PATH);

    const band = page.locator("section", {
        has: page.getByRole("heading", { name: "Deja tu huella." }),
    });
    const fingerprint = band.locator("svg[aria-hidden='true']").first();

    await expect(fingerprint).toHaveAttribute("data-waiting", "true");

    await band.scrollIntoViewIfNeeded();

    await expect(fingerprint).not.toHaveAttribute("data-waiting");
});

test("the footer's about link lands on it", async ({ page }) => {
    await page.goto("/");

    await page
        .getByRole("contentinfo")
        .getByRole("link", { name: "Sobre Huella Legal", exact: true })
        .click();

    await expect(page).toHaveURL(new RegExp(`${PATH}$`));
});

// Reduced motion leaves every scroll-revealed block visible, so axe and the screenshot see them all
test("the about page has no WCAG AA violations", async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(PATH);

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

    expect(violations).toEqual([]);

    const path = testInfo.outputPath(`about-${testInfo.project.name}.png`);

    await page.screenshot({ path, fullPage: true });
    await testInfo.attach(`about-${testInfo.project.name}`, { path, contentType: "image/png" });
});
