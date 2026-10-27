import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@monorepo/configs/playwright/test";
import { ARTICLE, SUBJECT } from "./fakes.ts";
import { TURNSTILE_SCRIPT, TURNSTILE_SCRIPT_PATTERN } from "./vendors.ts";

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test.beforeEach(async ({ page }) => {
    await page.route(TURNSTILE_SCRIPT_PATTERN, (route) =>
        route.fulfill({ contentType: "text/javascript", body: TURNSTILE_SCRIPT }),
    );
});

test("subscribes from the band under an article and asks the reader to confirm", async ({
    page,
}) => {
    await page.goto(`/${ARTICLE.slug}/`);

    const band = page.getByRole("region", { name: "Un correo al mes" });
    const confirmation = band.getByRole("heading", { name: "Revisa tu bandeja de entrada" });

    // CI's runner can type before hydration, which a server-rendered form then drops on submit
    await expect(async () => {
        await band.getByRole("textbox", { name: "Correo electrónico" }).fill("lucia@ejemplo.test");
        await band.getByRole("button", { name: "Suscribirme" }).click();

        await expect(confirmation).toBeVisible({ timeout: 2000 });
    }).toPass();

    await expect(confirmation).toBeFocused();

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

    expect(violations).toEqual([]);
});

test("refuses an address with no domain without sending it", async ({ page }) => {
    let sent = false;

    page.on("request", (request) => {
        if (request.url().endsWith("/api/newsletter")) sent = true;
    });

    await page.goto(`/areas/${SUBJECT.slug}/`);

    // The sidebar card is the subject page's only newsletter form
    const email = page.getByRole("textbox", { name: "Correo electrónico" });

    await expect(async () => {
        await email.fill("lucia@");
        await page.getByRole("button", { name: "Suscribirme" }).click();

        await expect(email).toHaveAttribute("aria-invalid", "true", { timeout: 500 });
    }).toPass();

    expect(sent).toBe(false);
});
