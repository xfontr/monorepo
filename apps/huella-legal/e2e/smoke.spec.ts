import { expect, NOT_FOUND_DOCUMENT, test } from "@monorepo/configs/playwright/test";
import { ESCAPED, HEADING } from "./fakes.ts";

test("opens an article by its slug", async ({ page }) => {
    await page.goto(`/${ESCAPED.slug}/`);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        ESCAPED.title.replace("&amp;", "&"),
    );
    await expect(page.getByRole("heading", { level: 2, name: HEADING })).toBeVisible();
});

test.describe("an unknown slug", () => {
    test.use({ allowedConsole: [NOT_FOUND_DOCUMENT] });

    test("answers an unknown slug with a real 404", async ({ page }) => {
        const response = await page.goto("/no-existe/");

        expect(response?.status()).toBe(404);
    });
});
