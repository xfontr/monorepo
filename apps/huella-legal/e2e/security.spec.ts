import { expect, test } from "@monorepo/configs/playwright/test";
import { ESCAPED, HOSTILE_LINK } from "./fakes.ts";

const ARTICLE_PATH = `/${ESCAPED.slug}/`;

test("every page carries the headers that stop framing, sniffing and a downgrade to HTTP", async ({
    request,
}) => {
    for (const path of [ARTICLE_PATH, "/api/home"]) {
        const headers = (await request.get(path)).headers();

        expect(headers["strict-transport-security"]).toBe("max-age=31536000");
        expect(headers["x-content-type-options"]).toBe("nosniff");
        expect(headers["x-frame-options"]).toBe("DENY");
        expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    }
});

test("markup a compromised editor saves in a post never runs on the page", async ({ page }) => {
    await page.goto(ARTICLE_PATH);

    const anchor = page.getByText(HOSTILE_LINK);

    await anchor.hover();
    await anchor.click();

    expect(await page.evaluate(() => "pwned" in globalThis)).toBe(false);
    // Stripped of its `javascript:` href, it is no longer a link at all
    await expect(page.getByRole("link", { name: HOSTILE_LINK })).toHaveCount(0);
    await expect(page.locator("main script, main iframe, main svg[onload]")).toHaveCount(0);
});
