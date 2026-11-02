import { describe, expect, it, vi } from "vitest";

interface Html {
    head: string[];
}

vi.stubGlobal("defineNitroPlugin", (plugin: unknown) => plugin);

const plugin = (await import("./deferHydration")).default as unknown as (nitroApp: unknown) => void;

const STYLESHEET = '<link rel="stylesheet" href="/_nuxt/entry.css" crossorigin>';
const ENTRY = "/_nuxt/entry.js";

const HEAD = [
    STYLESHEET,
    `<link rel="modulepreload" as="script" crossorigin href="${ENTRY}">\n<link rel="modulepreload" as="script" crossorigin href="/_nuxt/vue.js">`,
    `<script type="module" src="${ENTRY}" crossorigin></script>`,
];

const render = (): string => {
    const html: Html = { head: [...HEAD] };

    plugin({ hooks: { hook: (_name: string, fn: (html: Html) => void) => fn(html) } });

    return html.head.join("\n");
};

// Runs the inline script against a stand-in for the window, the way the browser would
const runInBrowser = (head: string) => {
    const source = /<script>([\s\S]*?)<\/script>/.exec(head)?.[1] ?? "";
    const listeners = new Map<string, () => void>();
    const appended: object[] = [];

    const addEventListener = (type: string, listener: () => void) => listeners.set(type, listener);
    const document = {
        head: { append: (node: object) => appended.push(node) },
        createElement: () => ({}),
    };

    new Function("addEventListener", "document", source)(addEventListener, document);

    return { appended, load: () => listeners.get("load")?.() };
};

describe("the deferred hydration plugin", () => {
    it("drops every module preload, so no hydration chunk downloads before the page has loaded", () => {
        expect(render()).not.toContain("modulepreload");
    });

    it("takes the entry away from the parser", () => {
        expect(render()).not.toContain('<script type="module"');
    });

    it("loads nothing until the window has loaded", () => {
        expect(runInBrowser(render()).appended).toEqual([]);
    });

    it("loads the entry as a module with the crossorigin Nuxt gave it once the window has loaded", () => {
        const browser = runInBrowser(render());

        browser.load();

        expect(browser.appended).toEqual([{ type: "module", crossOrigin: "", src: ENTRY }]);
    });

    it("leaves the stylesheet alone, which the first paint needs", () => {
        expect(render()).toContain(STYLESHEET);
    });
});
