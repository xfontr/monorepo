import type { Nuxt } from "@nuxt/schema";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("nuxt/kit", () => ({ defineNuxtModule: (definition: unknown) => definition }));

const { setup } = (await import("./stagingGate")).default as unknown as {
    setup: (options: unknown, nuxt: Nuxt) => void;
};

type Gate = (request: Request) => Response | undefined;

const STAGING = "https://staging.huellalegal.com/";

let rootDir: string;

const edgeDir = () => join(rootDir, ".netlify/edge-functions");

const build = async (options: Partial<Nuxt["options"]> = {}): Promise<boolean> => {
    let compiled: (() => Promise<void>) | undefined;
    const nitro = {
        options: { rootDir },
        hooks: { hook: (_: string, fn: () => Promise<void>) => (compiled = fn) },
    };
    const hook = (_: string, fn: (value: typeof nitro) => void) => fn(nitro);
    const runtimeConfig = { public: { site: { url: "https://www.huellalegal.com" } } };

    setup({}, { options: { dev: false, runtimeConfig, ...options }, hook } as unknown as Nuxt);
    await compiled?.();

    return compiled !== undefined;
};

const loadGate = async (): Promise<Gate> => {
    const url = `${pathToFileURL(join(edgeDir(), "staging-gate.js")).href}?${Math.random()}`;

    return (await import(/* @vite-ignore */ url)).default;
};

const request = (url: string, credentials?: string) =>
    new Request(url, {
        headers: credentials
            ? { authorization: `Basic ${Buffer.from(credentials).toString("base64")}` }
            : {},
    });

const env = (vars: Record<string, string | undefined>) =>
    vi.stubGlobal("Netlify", { env: { get: (name: string) => vars[name] } });

beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), "staging-gate-"));
    vi.stubEnv("NUXT_SITE_ENV", "production");
    vi.stubEnv("NUXT_PUBLIC_SITE_URL", "");
    env({ STAGING_USERNAME: "editor", STAGING_PASSWORD: "s3cret" });
});

afterEach(async () => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    await rm(rootDir, { recursive: true, force: true });
});

describe("stagingGate module", () => {
    it("routes pages through the gate but leaves the hashed assets out", async () => {
        await build();

        const manifest = JSON.parse(await readFile(join(edgeDir(), "manifest.json"), "utf8"));

        expect(manifest.functions).toEqual([
            expect.objectContaining({
                function: "staging-gate",
                path: "/*",
                excludedPath: expect.arrayContaining(["/_nuxt/*"]),
            }),
        ]);
    });

    it.each(["https://www.huellalegal.com/sobre/", "https://huellalegal.com/"])(
        "never asks a reader on the public host %s for a password",
        async (url) => {
            env({});
            await build();

            expect((await loadGate())(request(url))).toBeUndefined();
        },
    );

    it("takes the public host from NUXT_PUBLIC_SITE_URL when it overrides the literal", async () => {
        vi.stubEnv("NUXT_PUBLIC_SITE_URL", "https://www.example.org");
        await build();

        const gate = await loadGate();

        expect(gate(request("https://www.example.org/"))).toBeUndefined();
        expect(gate(request("https://www.huellalegal.com/"))?.status).toBe(401);
    });

    it.each([
        STAGING,
        "https://huella-legal.netlify.app/",
        "https://6aef4ce2db378b2cd9bfd57c--huella-legal.netlify.app/",
    ])("asks for credentials on %s instead of serving the page", async (url) => {
        await build();

        const response = (await loadGate())(request(url));

        expect(response?.status).toBe(401);
        expect(response?.headers.get("WWW-Authenticate")).toMatch(/^Basic realm=/);
    });

    it("lets the right credentials through to the page", async () => {
        await build();

        expect((await loadGate())(request(STAGING, "editor:s3cret"))).toBeUndefined();
    });

    it("lets a non-ASCII password through rather than throwing in btoa", async () => {
        env({ STAGING_USERNAME: "editor", STAGING_PASSWORD: "contraseña" });
        await build();

        expect((await loadGate())(request(STAGING, "editor:contraseña"))).toBeUndefined();
    });

    it("refuses a wrong password", async () => {
        await build();

        expect((await loadGate())(request(STAGING, "editor:guess"))?.status).toBe(401);
    });

    // Unset vars would otherwise make "undefined:undefined" a working login
    it.each([
        { STAGING_USERNAME: undefined, STAGING_PASSWORD: "s3cret" },
        { STAGING_USERNAME: "editor", STAGING_PASSWORD: undefined },
    ])("stays shut when a credential is unset, %o", async (vars) => {
        env(vars);
        await build();

        const credentials = `${vars.STAGING_USERNAME}:${vars.STAGING_PASSWORD}`;

        expect((await loadGate())(request(STAGING, credentials))?.status).toBe(401);
    });

    it.each(["preview", ""])("never ships the gate on a %j build", async (siteEnv) => {
        vi.stubEnv("NUXT_SITE_ENV", siteEnv);

        await build();

        expect(existsSync(join(edgeDir(), "staging-gate.js"))).toBe(false);
    });

    it("clears a previous production build's gate so a preview can't deploy it", async () => {
        await mkdir(edgeDir(), { recursive: true });
        await writeFile(join(edgeDir(), "staging-gate.js"), "");
        await writeFile(join(edgeDir(), "manifest.json"), "{}");
        vi.stubEnv("NUXT_SITE_ENV", "preview");

        await build();

        expect(existsSync(join(edgeDir(), "staging-gate.js"))).toBe(false);
        expect(existsSync(join(edgeDir(), "manifest.json"))).toBe(false);
    });

    it.each([{ dev: true }, { _prepare: true }])("writes nothing under %o", async (options) => {
        expect(await build(options)).toBe(false);
    });
});
