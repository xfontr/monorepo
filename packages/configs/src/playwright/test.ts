import { test as base, expect } from "@playwright/test";

// Chrome logs every document that answers 404, so a test that asks for one allows it
export const NOT_FOUND_DOCUMENT =
    /^Failed to load resource: the server responded with a status of 404\b/;

/** `@playwright/test`'s `test`, failing any test whose page logs or throws. */
export const test = base.extend<{ allowedConsole: RegExp[] }>({
    allowedConsole: [[], { option: true }],

    page: async ({ page, allowedConsole }, use) => {
        const output: string[] = [];
        const isAllowed = (text: string) => allowedConsole.some((pattern) => pattern.test(text));

        page.on("console", (message) => {
            if (isAllowed(message.text())) return;

            const { url, lineNumber } = message.location();
            output.push(`console.${message.type()}: ${message.text()} (${url}:${lineNumber})`);
        });
        page.on("pageerror", (error) => {
            if (!isAllowed(error.message)) output.push(`pageerror: ${error.message}`);
        });

        await use(page);

        expect(output, "the page logged to its console").toEqual([]);
    },
});

export { expect };
