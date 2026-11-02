const MODULE_PRELOADS = /<link rel="modulepreload"[^>]*>\n?/g;
const ENTRY_SCRIPT = /<script type="module" src="([^"]+)" crossorigin><\/script>/;

declare const document: {
    head: { append(node: object): void };
    createElement(tag: "script"): { type: string; crossOrigin: string; src: string };
};

const loadEntryOnWindowLoad = (src: string): void => {
    addEventListener("load", () => {
        const script = document.createElement("script");

        script.type = "module";
        script.crossOrigin = "";
        script.src = src;
        document.head.append(script);
    });
};

const toInlineScript = (fn: (arg: string) => void, arg: string): string =>
    `<script>(${fn.toString()})(${JSON.stringify(arg)})</script>`;

const deferHydration = (headChunk: string): string =>
    headChunk
        .replace(MODULE_PRELOADS, "")
        .replace(ENTRY_SCRIPT, (_tag, src: string) => toInlineScript(loadEntryOnWindowLoad, src));

export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook("render:html", (html) => {
        html.head = html.head.map(deferHydration);
    });
});
