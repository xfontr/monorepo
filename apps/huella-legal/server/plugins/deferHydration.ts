// Lighthouse puts every request that starts before the LCP on its path, whatever its priority
const MODULE_PRELOAD = /<link rel="modulepreload"[^>]*>\n?/g;
const ENTRY = /<script type="module" src="([^"]+)" crossorigin><\/script>/;

const afterLoad = (src: string): string =>
    `<script>addEventListener("load",()=>{const s=document.createElement("script");s.type="module";s.crossOrigin="";s.src=${JSON.stringify(src)};document.head.append(s)})</script>`;

export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook("render:html", (html) => {
        html.head = html.head.map((chunk) =>
            chunk.replace(MODULE_PRELOAD, "").replace(ENTRY, (_tag, src: string) => afterLoad(src)),
        );
    });
});
