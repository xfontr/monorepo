import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { defineNuxtModule } from "nuxt/kit";

const NAME = "preview-gate";

const GATE = `const encode = (text) => btoa(String.fromCharCode(...new TextEncoder().encode(text)));

export default (request) => {
    const username = Netlify.env.get("PREVIEW_USERNAME");
    const password = Netlify.env.get("PREVIEW_PASSWORD");
    const expected = "Basic " + encode(username + ":" + password);

    if (username && password && request.headers.get("authorization") === expected) return;

    return new Response("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Huella Legal preview", charset="UTF-8"' },
    });
};
`;

const MANIFEST = {
    version: 1,
    functions: [{ function: NAME, name: "preview password", path: "/*" }],
};

const writeGate = async (dir: string, enabled: boolean): Promise<void> => {
    const files = [join(dir, `${NAME}.js`), join(dir, "manifest.json")];

    // A preview build's leftovers would lock production out if it were deployed from the same checkout
    if (!enabled) {
        await Promise.all(files.map((file) => rm(file, { force: true })));
        return;
    }

    await mkdir(dir, { recursive: true });
    await writeFile(files[0]!, GATE);
    await writeFile(files[1]!, JSON.stringify(MANIFEST, null, 2));
};

export default defineNuxtModule({
    meta: { name: "preview-gate" },

    setup: (_, { options, hook }) => {
        if (options._prepare || options.dev) return;

        hook("nitro:init", (nitro) => {
            nitro.hooks.hook("compiled", () =>
                writeGate(
                    join(nitro.options.rootDir, ".netlify/edge-functions"),
                    process.env.NUXT_SITE_ENV === "preview",
                ),
            );
        });
    },
});
