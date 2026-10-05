import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// The header switches to the slideover below Tailwind's `lg`
const DESKTOP = 1024;

test("the skip link is the first stop and moves focus into the main landmark", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");

    const skip = page.getByRole("link", { name: "Saltar al contenido" });

    await expect(skip).toBeFocused();
    // toBeVisible passes for a link the header paints over, so check it is the topmost element too
    expect(await skip.evaluate((link) => {
        const { x, y, width, height } = link.getBoundingClientRect();

        return link.ownerDocument.elementFromPoint(x + width / 2, y + height / 2) === link;
    })).toBe(true);

    await skip.press("Enter");

    await expect(page.getByRole("main")).toBeFocused();
});

test("the header reaches every section, inline on desktop and through the menu below it", async ({ page }) => {
    await page.goto("/");

    const wide = (page.viewportSize()?.width ?? 0) >= DESKTOP;

    if (!wide) {
        await page.getByRole("button", { name: "Abrir menú" }).click();

        await expect(page.getByRole("dialog", { name: "Menú" })).toBeVisible();
    }

    const nav = wide ? page.getByRole("banner").getByRole("navigation", { name: "Principal" }) : page.getByRole("dialog").getByRole("navigation", { name: "Principal" });

    await expect(nav.getByRole("link")).toHaveText(["Publicaciones", "Materias", "Colaboradores", "Publicar"]);
});

test("an unknown path answers 404 with the not-found design inside the shell", async ({ page }) => {
    const response = await page.goto("/no-existe/");

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Esta página no existe o ha cambiado de dirección.");
    await expect(page).toHaveTitle("Error 404");
});

test("the not-found page has no WCAG AA violations", async ({ page }) => {
    await page.goto("/no-existe/");

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

    expect(violations).toEqual([]);
});

test("the not-found page matches its baseline", async ({ page }) => {
    await page.goto("/no-existe/");

    await expect(page).toHaveScreenshot("not-found.png", { fullPage: true });
});

test("the open mobile menu has no WCAG AA violations", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= DESKTOP, "The menu only exists below lg");

    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

    expect(violations).toEqual([]);
});
