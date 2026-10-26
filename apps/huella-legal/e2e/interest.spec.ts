import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "@monorepo/configs/playwright/test";

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const PATH = "/calculo-intereses/";

// A click before hydration submits the form natively and reloads the page, losing the result
const open = async (page: Page) => {
    const response = await page.goto(PATH);

    await expect
        .poll(() => page.locator("#__nuxt").evaluate((root) => "__vue_app__" in root))
        .toBe(true);

    return response;
};

// 1 000 EUR over a 365-day year makes the interest the annual rate applied once
const fillYear = async (page: Page) => {
    await page.getByLabel("Capital").fill("1000");
    await page.getByLabel("Fecha de inicio").fill("2026-01-01");
    await page.getByLabel("Fecha final").fill("2027-01-01");
};

const calculate = (page: Page) => page.getByRole("button", { name: "Calcular" }).click();

test("the calculator page answers 200 with its heading inside the shell", async ({ page }) => {
    const response = await open(page);

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cálculo de intereses");
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page).toHaveTitle("Cálculo de intereses");
});

test("calculates the legal, judicial and custom rates and announces each result", async ({
    page,
}) => {
    await open(page);

    const result = page.getByRole("status");

    await fillYear(page);
    await calculate(page);

    await expect(result).toContainText("365");
    await expect(result).toContainText(/32,50\s€/);
    await expect(result).toContainText(/1\.?032,50\s€/);

    await page.getByRole("radio", { name: /judicial/ }).check();

    await expect(result).not.toContainText(/32,50\s€/);

    await calculate(page);

    await expect(result).toContainText(/52,50\s€/);

    await page.getByRole("radio", { name: "Personalizado" }).check();
    await page.getByLabel("Tipo personalizado").fill("4");
    await calculate(page);

    await expect(result).toContainText(/40,00\s€/);
});

test("announces a failed submit in an alert that links to each invalid field", async ({ page }) => {
    await open(page);

    await calculate(page);

    const alert = page.getByRole("alert");

    await expect(alert).toContainText("Revisa 3 campos antes de enviar");
    await expect(alert.getByRole("link", { name: "Capital" })).toBeVisible();
    await expect(alert).toContainText("Capital: Escribe un capital mayor que cero");
    await expect(page.getByRole("status")).not.toContainText("Intereses");

    await alert.getByRole("link", { name: "Fecha de inicio" }).click();
    await expect(page.getByLabel("Fecha de inicio")).toBeFocused();

    await fillYear(page);
    await page.getByLabel("Fecha final").fill("2025-01-01");
    await calculate(page);

    await expect(page.getByRole("alert")).toContainText(
        "Fecha final: La fecha final no puede ser anterior a la de inicio",
    );
});

test("the form fits the viewport without scrolling sideways", async ({ page }) => {
    await open(page);

    const overflow = await page
        .locator("html")
        .evaluate((html) => html.scrollWidth - html.clientWidth);

    expect(overflow).toBeLessThanOrEqual(0);
});

test("the calculator has no WCAG AA violations empty, with errors and with a result", async ({
    page,
}) => {
    await open(page);

    const scan = async () =>
        (await new AxeBuilder({ page }).withTags(WCAG_AA).analyze()).violations;

    expect(await scan()).toEqual([]);

    await calculate(page);
    await expect(page.getByRole("alert")).toBeVisible();

    expect(await scan()).toEqual([]);

    await fillYear(page);
    await page.getByRole("radio", { name: "Personalizado" }).check();
    await page.getByLabel("Tipo personalizado").fill("4");
    await calculate(page);
    await expect(page.getByRole("status")).toContainText(/40,00\s€/);

    expect(await scan()).toEqual([]);
});

test("records the page with a result at this width for review", async ({ page }, testInfo) => {
    await open(page);
    await fillYear(page);
    await calculate(page);
    await expect(page.getByRole("status")).toContainText(/32,50\s€/);

    await testInfo.attach(`calculo-intereses-${testInfo.project.name}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
    });
});
