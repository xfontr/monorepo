import AxeBuilder from "@axe-core/playwright";
import { expect } from "@monorepo/configs/playwright/test";
import type { Page } from "@playwright/test";

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

/** Answers the form's own route in the browser, so the server half and its vendors never run. */
export const answerWith = (page: Page, endpoint: string, status: number, body?: unknown) =>
    page.route(`**${endpoint}`, (route) =>
        route.fulfill(body ? { status, json: body } : { status }),
    );

interface EmptyForm {
    path: string;
    endpoint: string;
    button: string;
    fields: string[];
}

/** Submits the form untouched and pins that it names every required field and never posts. */
export const expectEmptyFormRefused = async (
    page: Page,
    { path, endpoint, button, fields }: EmptyForm,
) => {
    let sent = false;

    page.on("request", (request) => {
        if (request.url().endsWith(endpoint)) sent = true;
    });

    await page.goto(path);

    const summary = page.getByRole("alert");

    await expect(async () => {
        await page.getByRole("button", { name: button }).click();

        await expect(summary).toBeVisible({ timeout: 500 });
    }).toPass();

    await expect(summary.getByRole("link")).toHaveText(fields);
    expect(sent).toBe(false);

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

    expect(violations).toEqual([]);
};
