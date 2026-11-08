import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@monorepo/configs/playwright/test";
import type { Page } from "@playwright/test";
import { TURNSTILE_SCRIPT, TURNSTILE_SCRIPT_PATTERN } from "./vendors.ts";

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const PATH = "/publicar/";

const SUMMARY = "La admisibilidad de los mensajes de WhatsApp como prueba.";

// The route's own behaviour is its spec's, so the browser's request is answered here
const answerWith = (page: Page, status: number, body?: unknown) =>
    page.route("**/api/submissions", (route) =>
        route.fulfill(body ? { status, json: body } : { status }),
    );

const send = async (page: Page, settled: () => Promise<void>) => {
    // CI's runner can type before hydration, which a server-rendered form then drops on submit
    await expect(async () => {
        await page.getByRole("textbox", { name: "Nombre y apellidos" }).fill("Lucía Pérez");
        await page.getByRole("textbox", { name: "Correo electrónico" }).fill("lucia@ejemplo.test");
        await page.getByRole("textbox", { name: "Resumen" }).fill(SUMMARY);
        await page.locator("input[type=file]").setInputFiles({
            name: "borrador.docx",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
        });
        await page.getByRole("checkbox").check();
        await page.getByRole("button", { name: "Enviar propuesta" }).click();

        await settled();
    }).toPass();
};

test.beforeEach(async ({ page }) => {
    await page.route(TURNSTILE_SCRIPT_PATTERN, (route) =>
        route.fulfill({ contentType: "text/javascript", body: TURNSTILE_SCRIPT }),
    );
});

test("the publish page answers 200 with its heading inside the shell", async ({ page }) => {
    const response = await page.goto(PATH);

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Tu artículo, leído con la atención que merece.",
    );
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page).toHaveTitle("Publicar - Huella Legal");
});

test("keeps the editorial inbox as a mailto for an author who'd rather write", async ({ page }) => {
    await page.goto(PATH);

    await expect(
        page.getByRole("link", { name: "colaboraciones@huellalegal.com" }),
    ).toHaveAttribute("href", "mailto:colaboraciones@huellalegal.com");
});

test("sends a proposal with its draft and confirms it in place of the form", async ({ page }) => {
    let body = "";

    await page.route("**/api/submissions", async (route) => {
        body = route.request().postData() ?? "";
        await route.fulfill({ status: 204 });
    });
    await page.goto(PATH);

    const confirmation = page.getByRole("heading", { name: "Propuesta enviada" });

    await send(page, () => expect(confirmation).toBeVisible({ timeout: 2000 }));

    await expect(confirmation).toBeFocused();
    expect(body).toContain('filename="borrador.docx"');
    expect(body).toContain(SUMMARY);
});

test("refuses an empty form without sending it, naming each field", async ({ page }) => {
    let sent = false;

    page.on("request", (request) => {
        if (request.url().endsWith("/api/submissions")) sent = true;
    });

    await page.goto(PATH);

    const summary = page.getByRole("alert");

    await expect(async () => {
        await page.getByRole("button", { name: "Enviar propuesta" }).click();

        await expect(summary).toBeVisible({ timeout: 500 });
    }).toPass();

    await expect(summary.getByRole("link")).toHaveText([
        "Nombre",
        "Correo electrónico",
        "Resumen",
        "Consentimiento",
    ]);
    expect(sent).toBe(false);

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

    expect(violations).toEqual([]);
});

test.describe("a refused send", () => {
    // Chrome logs every response that fails, and these fail on purpose
    test.use({ allowedConsole: [/the server responded with a status of (422|502)\b/] });

    test("puts the server's refusal of the file on the file field", async ({ page }) => {
        await answerWith(page, 422, {
            statusCode: 422,
            statusMessage: "Invalid form",
            data: [{ name: "file", message: "fileType" }],
        });
        await page.goto(PATH);

        const alert = page.getByRole("alert");

        await send(page, () => expect(alert).toContainText("Adjunta un .docx", { timeout: 2000 }));

        await expect(alert.getByRole("link")).toHaveText("Borrador");
    });

    test("announces a failed send and keeps what the author wrote", async ({ page }) => {
        await answerWith(page, 502, { statusCode: 502, statusMessage: "Bad Gateway" });
        await page.goto(PATH);

        const alert = page.getByRole("alert");

        // The summary of an empty, pre-hydration submit is an alert too, so only the text settles it
        await send(page, () =>
            expect(alert).toContainText("No hemos podido enviar tu propuesta", { timeout: 2000 }),
        );

        await expect(page.getByRole("textbox", { name: "Resumen" })).toHaveValue(SUMMARY);

        const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

        expect(violations).toEqual([]);
    });
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

test("the publish page has no WCAG AA violations", async ({ page }, testInfo) => {
    await page.goto(PATH);

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

    await testInfo.attach(`publicar-${testInfo.project.name}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
    });
    expect(violations).toEqual([]);
});
