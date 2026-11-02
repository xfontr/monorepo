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

describe("the deferred hydration plugin", () => {
    it("drops every module preload, so no hydration chunk downloads before the page has loaded", () => {
        expect(render()).not.toContain("modulepreload");
    });

    it("loads the entry only once the window has loaded, instead of from the parser", () => {
        const head = render();

        expect(head).not.toContain('<script type="module"');
        expect(head).toContain('addEventListener("load"');
        expect(head).toContain(`s.src="${ENTRY}"`);
    });

    it("keeps the entry a module with the crossorigin attribute Nuxt gave it", () => {
        expect(render()).toContain('s.type="module";s.crossOrigin=""');
    });

    it("leaves the stylesheet alone, which the first paint needs", () => {
        expect(render()).toContain(STYLESHEET);
    });
});
