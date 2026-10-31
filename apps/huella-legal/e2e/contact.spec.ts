import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@monorepo/configs/playwright/test";
import type { Page } from "@playwright/test";
import { TURNSTILE_SCRIPT, TURNSTILE_SCRIPT_PATTERN } from "./vendors.ts";

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const PATH = "/contacto/";

// The route itself is #311's, so the browser's request is answered here and Resend never runs
const answerWith = (page: Page, status: number, body?: unknown) =>
    page.route("**/api/contact", (route) =>
        route.fulfill(body ? { status, json: body } : { status }),
    );

const send = async (page: Page, settled: () => Promise<void>) => {
    // CI's runner can type before hydration, which a server-rendered form then drops on submit
    await expect(async () => {
        await page.getByRole("textbox", { name: "Nombre y apellidos" }).fill("Lucía Pérez");
        await page.getByRole("textbox", { name: "Correo electrónico" }).fill("lucia@ejemplo.test");
        await page
            .getByRole("textbox", { name: "Mensaje" })
            .fill("Una pregunta sobre un artículo.");
        await page.getByRole("checkbox").check();
        await page.getByRole("button", { name: "Enviar mensaje" }).click();

        await settled();
    }).toPass();
};

test.beforeEach(async ({ page }) => {
    await page.route(TURNSTILE_SCRIPT_PATTERN, (route) =>
        route.fulfill({ contentType: "text/javascript", body: TURNSTILE_SCRIPT }),
    );
});

test("the contact page answers 200 with its heading inside the shell", async ({ page }) => {
    const response = await page.goto(PATH);

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Escribe a la redacción");
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page).toHaveTitle("Contacto");
});

test("the footer's contact link lands on the form", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("contentinfo").getByRole("link", { name: "Contacto" }).click();

    await expect(page).toHaveURL(/\/contacto\/$/);
    await expect(page.getByRole("button", { name: "Enviar mensaje" })).toBeVisible();
});

test("sends a message and confirms it in place of the form", async ({ page }) => {
    await answerWith(page, 204);
    await page.goto(PATH);

    const confirmation = page.getByRole("heading", { name: "Mensaje enviado" });

    await send(page, () => expect(confirmation).toBeVisible({ timeout: 2000 }));

    await expect(confirmation).toBeFocused();
    await expect(page.getByRole("button", { name: "Enviar mensaje" })).toHaveCount(0);
});

test("refuses an empty form without sending it, naming each field", async ({ page }) => {
    let sent = false;

    page.on("request", (request) => {
        if (request.url().endsWith("/api/contact")) sent = true;
    });

    await page.goto(PATH);

    const summary = page.getByRole("alert");

    await expect(async () => {
        await page.getByRole("button", { name: "Enviar mensaje" }).click();

        await expect(summary).toBeVisible({ timeout: 500 });
    }).toPass();

    await expect(summary.getByRole("link")).toHaveText([
        "Nombre",
        "Correo electrónico",
        "Mensaje",
        "Consentimiento",
    ]);
    expect(sent).toBe(false);

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

    expect(violations).toEqual([]);
});

test.describe("a refused send", () => {
    // Chrome logs every response that fails, and these fail on purpose
    test.use({ allowedConsole: [/the server responded with a status of (422|502)\b/] });

    test("puts the server's refusal on the field it names", async ({ page }) => {
        await answerWith(page, 422, {
            statusCode: 422,
            statusMessage: "Invalid message",
            data: [{ name: "email", message: "invalid" }],
        });
        await page.goto(PATH);

        const email = page.getByRole("textbox", { name: "Correo electrónico" });

        await send(page, () =>
            expect(email).toHaveAttribute("aria-invalid", "true", { timeout: 2000 }),
        );

        await expect(page.getByRole("alert")).toContainText("Correo electrónico");
    });

    test("announces a failed send and keeps what the reader wrote", async ({ page }) => {
        await answerWith(page, 502, { statusCode: 502, statusMessage: "Bad Gateway" });
        await page.goto(PATH);

        const alert = page.getByRole("alert");

        await send(page, () => expect(alert).toBeVisible({ timeout: 2000 }));

        await expect(alert).toContainText("No hemos podido enviar tu mensaje");
        await expect(page.getByRole("textbox", { name: "Mensaje" })).toHaveValue(
            "Una pregunta sobre un artículo.",
        );
    });
});

test("the page fits the viewport without scrolling sideways", async ({ page }) => {
    await page.goto(PATH);

    const overflow = await page
        .locator("html")
        .evaluate((html) => html.scrollWidth - html.clientWidth);

    expect(overflow).toBeLessThanOrEqual(0);
});

test("the contact page has no WCAG AA violations", async ({ page }) => {
    await page.goto(PATH);

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

    expect(violations).toEqual([]);
});

test("records the page at this width for review", async ({ page }, testInfo) => {
    await page.goto(PATH);

    await testInfo.attach(`contacto-${testInfo.project.name}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
    });
});
