import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Nuxt } from "nuxt/schema";
import { defineNuxtModule } from "nuxt/kit";

const NAME = "staging-gate";

const gate = (publicHosts: string[]) => `const PUBLIC_HOSTS = ${JSON.stringify(publicHosts)};

const encode = (text) => btoa(String.fromCharCode(...new TextEncoder().encode(text)));

export default (request) => {
    if (PUBLIC_HOSTS.includes(new URL(request.url).hostname)) return;

    const username = Netlify.env.get("STAGING_USERNAME");
    const password = Netlify.env.get("STAGING_PASSWORD");
    const expected = "Basic " + encode(username + ":" + password);

    if (username && password && request.headers.get("authorization") === expected) return;

    return new Response("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Huella Legal staging", charset="UTF-8"' },
    });
};
`;

const GATED_HOSTS = String.raw`^(staging\..+|.+\.netlify\.app)$`;

const MANIFEST = {
    version: 1,
    functions: [
        {
            function: NAME,
            name: "staging password",
            path: "/*",
            // Assets are public on the site's own host anyway, and each one would cost an invocation
            excludedPath: ["/_nuxt/*", "/_fonts/*", "/.netlify/*"],
            header: { host: GATED_HOSTS },
        },
    ],
};

const listPublicHosts = ({ runtimeConfig }: Nuxt["options"]): string[] => {
    const { site } = runtimeConfig.public as { site: { url: string } };
    const host = new URL(process.env.NUXT_PUBLIC_SITE_URL || site.url).hostname;

    return [host, host.replace(/^www\./, "")];
};

const writeGate = async (dir: string, publicHosts?: string[]): Promise<void> => {
    const files = [join(dir, `${NAME}.js`), join(dir, "manifest.json")];

    // A production build's leftovers would gate a preview deployed from the same checkout
    if (!publicHosts) {
        await Promise.all(files.map((file) => rm(file, { force: true })));
        return;
    }

    await mkdir(dir, { recursive: true });
    await writeFile(files[0]!, gate(publicHosts));
    await writeFile(files[1]!, JSON.stringify(MANIFEST, null, 2));
};

export default defineNuxtModule({
    meta: { name: "staging-gate" },

    setup: (_, { options, hook }) => {
        if (options._prepare || options.dev) return;

        hook("nitro:init", (nitro) => {
            nitro.hooks.hook("compiled", () =>
                writeGate(
                    join(nitro.options.rootDir, ".netlify/edge-functions"),
                    process.env.NUXT_SITE_ENV === "production"
                        ? listPublicHosts(options)
                        : undefined,
                ),
            );
        });
    },
});
