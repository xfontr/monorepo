import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@monorepo/configs/playwright/test";
import type { Page } from "@playwright/test";
import { ARTICLE, COMMENTER, REPLIER } from "./fakes.ts";
import { TURNSTILE_SCRIPT, TURNSTILE_SCRIPT_PATTERN } from "./vendors.ts";

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const PATH = `/${ARTICLE.slug}/`;

const section = (page: Page) => page.getByRole("region", { name: "2 comentarios" });

const write = async (page: Page, settled: () => Promise<void>) => {
    // The newsletter band below the article has an email field of its own
    const form = page.locator("#comentarios");

    // CI's runner can type before hydration, which a server-rendered form then drops on submit
    await expect(async () => {
        await form.getByRole("textbox", { name: "Comentario" }).fill("Muy buen artículo.");
        await form.getByRole("textbox", { name: "Nombre" }).fill("Lucía Pérez");
        await form.getByRole("textbox", { name: "Correo electrónico" }).fill("lucia@ejemplo.test");
        await form.getByRole("checkbox").check();
        await form.getByRole("button", { name: "Enviar comentario" }).click();

        await settled();
    }).toPass();
};

test.beforeEach(async ({ page }) => {
    await page.route(TURNSTILE_SCRIPT_PATTERN, (route) =>
        route.fulfill({ contentType: "text/javascript", body: TURNSTILE_SCRIPT }),
    );
});

test("shows the article's thread, with the reply nested under the comment it answers", async ({
    page,
}) => {
    await page.goto(PATH);

    const comments = section(page);

    await expect(comments.getByRole("article")).toHaveCount(2);
    await expect(comments.getByRole("article", { name: COMMENTER })).toBeVisible();
    await expect(
        comments.getByRole("listitem").getByRole("list").getByRole("article", { name: REPLIER }),
    ).toBeVisible();
});

test("the byline's comment count leads to the thread", async ({ page }) => {
    await page.goto(PATH);

    await page.getByRole("link", { name: "2 comentarios" }).first().click();

    await expect(page).toHaveURL(/#comentarios$/);
});

test("a reply is held for moderation and confirmed in place of the form", async ({ page }) => {
    await page.goto(PATH);

    await section(page)
        .getByRole("button", { name: `Responder a ${COMMENTER}` })
        .click();
    await expect(page.getByText(`Respondes a ${COMMENTER}`)).toBeVisible();

    const confirmation = page.getByRole("heading", { name: "Comentario enviado" });

    await write(page, () => expect(confirmation).toBeVisible({ timeout: 2000 }));

    await expect(confirmation).toBeFocused();
});

test.describe("a refused comment", () => {
    // Chrome logs every response that fails, and this one fails on purpose
    test.use({ allowedConsole: [/the server responded with a status of 409\b/] });

    test("tells the reader they already sent it, keeping what they wrote", async ({ page }) => {
        await page.route("**/api/comments", (route) =>
            route.fulfill({ status: 409, json: { statusCode: 409, statusMessage: "Duplicate" } }),
        );
        await page.goto(PATH);

        const alert = page.getByRole("alert");

        await write(page, () =>
            expect(alert).toContainText("Ya nos habías enviado", { timeout: 2000 }),
        );

        await expect(
            page.locator("#comentarios").getByRole("textbox", { name: "Comentario" }),
        ).toHaveValue("Muy buen artículo.");
    });
});

test("the contents rail stays behind with the article once the thread scrolls into view", async ({
    page,
}) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1024, "The rail is an accordion below lg");

    await page.goto(PATH);
    await page.getByRole("button", { name: "Enviar comentario" }).scrollIntoViewIfNeeded();

    const rail = await page.getByRole("navigation", { name: "En este artículo" }).boundingBox();
    const thread = await section(page).boundingBox();

    expect(rail!.y + rail!.height).toBeLessThanOrEqual(thread!.y);
});

test("the comments section has no WCAG AA violations", async ({ page }) => {
    await page.goto(PATH);
    await expect(section(page).getByRole("article")).toHaveCount(2);

    const { violations } = await new AxeBuilder({ page })
        .include("#comentarios")
        .withTags(WCAG_AA)
        .analyze();

    expect(violations).toEqual([]);
});
