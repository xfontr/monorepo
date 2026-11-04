import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, NOT_FOUND_DOCUMENT, test } from "@monorepo/configs/playwright/test";
import { SUBJECT } from "./fakes.ts";

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// The header switches to the slideover below Tailwind's `lg`
const DESKTOP = 1024;

const openMenu = async (page: Page) => {
    const menu = page.getByRole("dialog", { name: "Menú" });

    await expect(async () => {
        if (!(await menu.isVisible()))
            await page.getByRole("button", { name: "Abrir menú" }).click();

        await expect(menu).toBeVisible({ timeout: 500 });
    }).toPass();
};

test("the skip link is the first stop and moves focus into the main landmark", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");

    const skip = page.getByRole("link", { name: "Saltar al contenido" });

    await expect(skip).toBeFocused();
    // toBeVisible passes for a link the header paints over, so check it is the topmost element too
    expect(
        await skip.evaluate((link) => {
            const { x, y, width, height } = link.getBoundingClientRect();

            return link.ownerDocument.elementFromPoint(x + width / 2, y + height / 2) === link;
        }),
    ).toBe(true);

    await skip.press("Enter");

    await expect(page.getByRole("main")).toBeFocused();
});

const openDropdown = async (page: Page, name: string) => {
    const trigger = page.getByRole("banner").getByRole("link", { name, exact: true });

    // Reka fills `aria-controls` on hydration, and a pointer resting on a trigger before then never opens it
    await expect(trigger).toHaveAttribute("aria-controls", /.+/);
    await trigger.hover();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
};

test("the header reaches every section, inline on desktop and through the menu below it", async ({
    page,
}) => {
    await page.goto("/");

    const wide = (page.viewportSize()?.width ?? 0) >= DESKTOP;

    if (!wide) await openMenu(page);

    const nav = wide
        ? page.getByRole("banner").getByRole("navigation", { name: "Principal" })
        : page.getByRole("dialog").getByRole("navigation", { name: "Principal" });

    await expect(nav.getByRole("link")).toHaveText(
        wide
            ? ["Publicaciones", "Áreas", "Revista", "Publicar"]
            : ["Publicaciones", "Áreas", "Publicar"],
    );
});

test("the about page is one step from the header, so a would-be author can find who publishes", async ({
    page,
}) => {
    await page.goto("/");

    if ((page.viewportSize()?.width ?? 0) >= DESKTOP) {
        await openDropdown(page, "Revista");
    } else {
        await openMenu(page);
        await page.getByRole("dialog").getByRole("button", { name: "Revista" }).click();
    }

    await expect(page.getByRole("link", { name: /^Sobre Huella Legal/ }).first()).toHaveAttribute(
        "href",
        "/sobre/",
    );
});

test("the publications dropdown previews the newest reads once it opens", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < DESKTOP, "The dropdowns only exist from lg");

    await page.goto("/");
    await openDropdown(page, "Publicaciones");

    await expect(
        page.getByRole("list", { name: "Destacado y lo último" }).getByRole("link"),
    ).toHaveCount(3);
});

test("the areas dropdown leads to the biggest areas and the whole index", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < DESKTOP, "The dropdowns only exist from lg");

    await page.goto("/");
    await openDropdown(page, "Áreas");

    await expect(
        page
            .getByRole("list", { name: "Las áreas con más publicaciones" })
            .getByRole("link", { name: new RegExp(`^${SUBJECT.name}\\s`) }),
    ).toHaveAttribute("href", `/areas/${SUBJECT.slug}/`);
    await expect(page.getByRole("link", { name: "Todas las áreas" }).first()).toBeVisible();
});

test("an open header dropdown has no WCAG AA violations", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < DESKTOP, "The dropdowns only exist from lg");

    await page.goto("/");
    await openDropdown(page, "Publicaciones");
    await expect(page.getByRole("list", { name: "Destacado y lo último" })).toBeVisible();

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

    expect(violations).toEqual([]);
});

test("the header follows a client-side navigation before anyone has touched it", async ({
    page,
}) => {
    test.skip((page.viewportSize()?.width ?? 0) < DESKTOP, "The inline menu only exists from lg");

    await page.goto("/publicaciones/");

    await page
        .getByRole("complementary")
        .getByRole("link", { name: new RegExp(`^${SUBJECT.name}\\s`) })
        .click();
    await expect(page).toHaveURL(new RegExp(`/areas/${SUBJECT.slug}/$`));

    const nav = page.getByRole("banner").getByRole("navigation", { name: "Principal" });

    await expect(nav.getByRole("link", { name: "Áreas" })).toHaveAttribute("aria-current", "true");
    await expect(nav.getByRole("link", { name: "Publicaciones" })).not.toHaveAttribute(
        "aria-current",
    );
});

test.describe("the not-found page", () => {
    test.use({ allowedConsole: [NOT_FOUND_DOCUMENT] });

    test("an unknown path answers 404 with the not-found design inside the shell", async ({
        page,
    }) => {
        const response = await page.goto("/no-existe/");

        expect(response?.status()).toBe(404);
        await expect(page.getByRole("banner")).toBeVisible();
        await expect(page.getByRole("contentinfo")).toBeVisible();
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(
            "Esta página no existe o ha cambiado de dirección.",
        );
        await expect(page).toHaveTitle("Error 404");
    });

    test("the not-found page has no WCAG AA violations", async ({ page }) => {
        await page.goto("/no-existe/");

        const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

        expect(violations).toEqual([]);
    });
});

test("a tap on the menu before the page hydrates still opens it once the app wakes", async ({
    page,
    baseURL,
}) => {
    test.skip((page.viewportSize()?.width ?? 0) >= DESKTOP, "The menu only exists below lg");

    let release = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));

    await page.route("**/_nuxt/*.js", async (route) => {
        await held;
        await route.continue();
    });

    // The frame's goto, since the fixture's `page.goto` waits for a hydration the held JS blocks
    await page.mainFrame().goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Abrir menú" }).click();
    release();

    await expect(page.getByRole("dialog", { name: "Menú" })).toBeVisible();
});

test("the open mobile menu has no WCAG AA violations", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= DESKTOP, "The menu only exists below lg");

    await page.goto("/");
    await openMenu(page);

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

    expect(violations).toEqual([]);
});
