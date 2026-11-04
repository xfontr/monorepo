const ENTRY_SCRIPT = /<script(?=[^>]*\stype="module")[^>]*\ssrc="([^"]+)"[^>]*><\/script>/;
const PENDING_CLICK = "__pendingClick";

interface EventSource {
    addEventListener(
        type: string,
        listener: (event: { target: unknown }) => void,
        options?: object,
    ): void;
}

declare const window: EventSource & Record<string, unknown>;
declare const document: {
    head: { append(node: object): void };
    createElement(tag: "script"): { type: string; crossOrigin: string; src: string };
};

const loadEntryOnLoadOrIntent = (src: string, pendingClick: string): void => {
    const controller = new AbortController();
    const once = { capture: true, once: true, passive: true, signal: controller.signal };

    const start = (): void => {
        if (controller.signal.aborted) return;
        controller.abort();

        const script = document.createElement("script");

        script.type = "module";
        script.crossOrigin = "";
        script.src = src;
        document.head.append(script);
    };

    window.addEventListener("load", start, { signal: controller.signal });
    for (const type of ["pointerdown", "keydown", "touchstart"]) {
        window.addEventListener(type, start, once);
    }

    window.addEventListener(
        "click",
        ({ target }) => {
            const control = (target as { closest?(selector: string): unknown })?.closest?.(
                "button, [role=button], summary",
            );

            if (control && window[pendingClick] === undefined) window[pendingClick] = control;
        },
        { capture: true },
    );
};

const toInlineScript = (fn: (...args: string[]) => void, ...args: string[]): string =>
    `<script>(${fn.toString()})(${args.map((arg) => JSON.stringify(arg)).join(",")})</script>`;

const deferHydration = (headChunk: string): string =>
    headChunk.replace(ENTRY_SCRIPT, (_tag, src: string) =>
        toInlineScript(loadEntryOnLoadOrIntent, src, PENDING_CLICK),
    );

export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook("render:html", (html) => {
        html.head = html.head.map(deferHydration);
    });
});
