import { describe, expect, it, vi } from "vitest";

interface Html {
    head: string[];
}

vi.stubGlobal("defineNitroPlugin", (plugin: unknown) => plugin);

const plugin = (await import("./deferHydration")).default as unknown as (nitroApp: unknown) => void;

const ENTRY = "/_nuxt/entry.js";
const UNTOUCHED = [
    '<script type="importmap">{"imports":{"#entry":"/_nuxt/entry.js"}}</script>',
    '<link rel="stylesheet" href="/_nuxt/entry.css" crossorigin>',
    '<link rel="preload" as="font" crossorigin href="/_nuxt/fonts/montserrat.woff2">',
];

const render = (entry = `<script type="module" src="${ENTRY}" crossorigin></script>`): string => {
    const html: Html = { head: [...UNTOUCHED, entry] };

    plugin({ hooks: { hook: (_name: string, fn: (html: Html) => void) => fn(html) } });

    return html.head.join("\n");
};

// Node's EventTarget honours `capture`, `once` and `signal` the way the browser does, and keeping
// the listeners lets a spec hand a click a target, which dispatching can't
class Target extends EventTarget {
    readonly listeners = new Map<string, (event: { target: unknown }) => void>();

    override addEventListener(type: string, listener: never, options?: never): void {
        this.listeners.set(type, listener);
        super.addEventListener(type, listener, options);
    }

    fire(type: string): void {
        this.dispatchEvent(new Event(type));
    }
}

// Runs the inline script against stand-ins for the window and the document, as the browser would
const runInBrowser = (head: string) => {
    const source = /<script>([\s\S]*?)<\/script>/.exec(head)?.[1] ?? "";
    const appended: object[] = [];
    const window = Object.assign(new Target(), {} as Record<string, unknown>);
    const document = {
        head: { append: (node: object) => appended.push(node) },
        createElement: () => ({}),
    };

    new Function("window", "document", source)(window, document);

    return { appended, window };
};

const LOADED = [{ type: "module", crossOrigin: "", src: ENTRY }];

describe("the deferred hydration plugin", () => {
    it("takes the entry away from the parser", () => {
        expect(render()).not.toContain('<script type="module"');
    });

    it("still finds the entry when its attributes come in another order or with extras", () => {
        const head = render(
            `<script crossorigin nonce="n0" src="${ENTRY}" type="module"></script>`,
        );

        expect(head).not.toContain('type="module"');
        expect(head).toContain(JSON.stringify(ENTRY));
    });

    it("leaves the import map, the stylesheet and the font preload alone", () => {
        const head = render();

        for (const tag of UNTOUCHED) expect(head).toContain(tag);
    });

    it("loads nothing before the window has loaded or the reader has done anything", () => {
        expect(runInBrowser(render()).appended).toEqual([]);
    });

    it.each(["load", "pointerdown", "keydown", "touchstart"])(
        "loads the entry once the window fires %s",
        (type) => {
            const browser = runInBrowser(render());

            browser.window.fire(type);

            expect(browser.appended).toEqual(LOADED);
        },
    );

    it("loads the entry only once, whichever triggers fire after the first", () => {
        const browser = runInBrowser(render());

        browser.window.fire("pointerdown");
        browser.window.fire("keydown");
        browser.window.fire("load");

        expect(browser.appended).toEqual(LOADED);
    });

    describe("the click it keeps for the app to replay", () => {
        const button = { tag: "button" };
        const inside = (control: object | null) => ({ closest: () => control });

        it("keeps the first control clicked before hydration and ignores the clicks after it", () => {
            const browser = runInBrowser(render());
            const click = browser.window.listeners.get("click")!;

            click({ target: inside(button) });
            click({ target: inside({ tag: "summary" }) });

            expect(browser.window.__pendingClick).toBe(button);
        });

        it("ignores a click outside any control and a target with no `closest`, such as text", () => {
            const browser = runInBrowser(render());
            const click = browser.window.listeners.get("click")!;

            click({ target: inside(null) });
            click({ target: {} });

            expect(browser.window.__pendingClick).toBeUndefined();
        });

        it("keeps nothing once the app has taken the slot, so a click is never replayed twice", () => {
            const browser = runInBrowser(render());
            const click = browser.window.listeners.get("click")!;

            browser.window.__pendingClick = null;
            click({ target: inside(button) });

            expect(browser.window.__pendingClick).toBeNull();
        });
    });
});
